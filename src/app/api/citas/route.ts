import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { hayChoqueCita } from "@/lib/agenda-server";
import {
  intervaloCita,
  validarDentroDeHorario,
} from "@/lib/agenda-core";
import {
  PLANTILLA_RECORDATORIO_DEFAULT,
  renderPlantilla,
  whatsappUrl,
} from "@/lib/plantillas";

function seleccionarCita() {
  return {
    id: true,
    fecha: true,
    duracion: true,
    motivo: true,
    notas: true,
    estado: true,
    actualizadoEn: true,
    clienteId: true,
    tatuajeId: true,
    cliente: {
      select: { id: true, nombre: true, telefono: true },
    },
    tatuaje: {
      select: {
        id: true,
        nombre: true,
        estado: true,
        precio: true,
        zona: true,
        estilo: true,
      },
    },
    usuario: {
      select: { id: true, nombre: true },
    },
  } as const;
}

async function programarRecordatorio(citaId: string, estudioId: number) {
  const cita = await prisma.cita.findFirst({
    where: { id: citaId, estudioId },
    include: {
      cliente: true,
      estudio: { include: { configuracion: true } },
    },
  });

  if (!cita || cita.estado !== "CONFIRMADA") return;

  const config = cita.estudio.configuracion;
  const horas = config?.horasAntesRecordatorio ?? 24;
  const programadoPara = new Date(cita.fecha);
  programadoPara.setHours(programadoPara.getHours() - horas);

  if (programadoPara < new Date()) return;

  const plantilla =
    config?.plantillaRecordatorio || PLANTILLA_RECORDATORIO_DEFAULT;
  const mensaje = renderPlantilla(plantilla, {
    nombre: cita.cliente.nombre,
    hora: new Date(cita.fecha).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    estudio: config?.nombreMostrar || cita.estudio.nombre,
  });

  await prisma.recordatorioCita.deleteMany({
    where: { citaId, estado: "PENDIENTE" },
  });

  await prisma.recordatorioCita.create({
    data: {
      estudioId,
      citaId,
      programadoPara,
      mensaje,
      urlWhatsapp: whatsappUrl(cita.cliente.telefono, mensaje),
      canal: "WHATSAPP",
      estado: "PENDIENTE",
    },
  });
}

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const esTatuador = authResult.user.rol === "TATUADOR";
  const userId = Number(authResult.user.id);

  const citas = await prisma.cita.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
      ...(esTatuador ? { usuarioId: userId } : {}),
    },
    orderBy: { fecha: "asc" },
    select: seleccionarCita(),
  });

  return NextResponse.json(citas);
}

export async function POST(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const id =
      typeof body.id === "string" && body.id.length > 0
        ? body.id
        : crypto.randomUUID();
    const clienteId = String(body.clienteId ?? "");
    const tatuajeId = body.tatuajeId ? String(body.tatuajeId) : null;
    const duracion = Number(body.duracion ?? 120);
    const fechaTexto = String(body.fecha ?? "").trim();
    const motivo = String(body.motivo ?? "").trim() || null;
    const notas = String(body.notas ?? "").trim() || null;
    let usuarioId = body.usuarioId ? Number(body.usuarioId) : null;
    if (authResult.user.rol === "TATUADOR") {
      usuarioId = Number(authResult.user.id);
    }

    if (!clienteId) {
      return NextResponse.json(
        { error: "Selecciona un cliente válido." },
        { status: 400 },
      );
    }

    if (!fechaTexto || Number.isNaN(Date.parse(fechaTexto))) {
      return NextResponse.json(
        { error: "Fecha inválida." },
        { status: 400 },
      );
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado." },
        { status: 404 },
      );
    }

    if (tatuajeId) {
      const tatuaje = await prisma.tatuaje.findFirst({
        where: {
          id: tatuajeId,
          clienteId,
          estudioId: authResult.user.estudioId,
          eliminadoEn: null,
        },
      });
      if (!tatuaje) {
        return NextResponse.json(
          { error: "Tatuaje no válido para este cliente." },
          { status: 400 },
        );
      }
    }

    const fecha = new Date(fechaTexto);
    const { inicio, fin } = intervaloCita(fecha, duracion);

    const horarios = await prisma.horarioEstudio.findMany({
      where: {
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
      },
    });

    if (horarios.length > 0) {
      const fuera = validarDentroDeHorario(fecha, duracion, horarios);
      if (fuera) {
        return NextResponse.json({ error: fuera }, { status: 400 });
      }
    }

    const choque = await hayChoqueCita({
      estudioId: authResult.user.estudioId,
      usuarioId,
      inicio,
      fin,
    });

    if (choque) {
      return NextResponse.json({ error: choque }, { status: 409 });
    }

    const cita = await prisma.cita.create({
      data: {
        id,
        fecha,
        duracion,
        motivo,
        notas,
        estado: "PENDIENTE",
        estudioId: authResult.user.estudioId,
        clienteId,
        tatuajeId,
        usuarioId,
      },
      select: seleccionarCita(),
    });

    return NextResponse.json(cita, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo crear la cita." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    if (!id) {
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }

    const existe = await prisma.cita.findFirst({
      where: {
        id,
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
      },
    });

    if (!existe) {
      return NextResponse.json(
        { error: "Cita no encontrada." },
        { status: 404 },
      );
    }

    if (body.estado === "FINALIZADA") {
      const config = await prisma.configuracionEstudio.findUnique({
        where: { estudioId: authResult.user.estudioId },
      });
      if (config?.exigirConsentimiento) {
        const waiver = await prisma.consentimiento.findFirst({
          where: {
            estudioId: authResult.user.estudioId,
            clienteId: existe.clienteId,
            eliminadoEn: null,
            OR: [{ citaId: id }, { citaId: null }],
          },
        });
        if (!waiver) {
          return NextResponse.json(
            {
              error:
                "Se requiere consentimiento firmado antes de finalizar la cita.",
            },
            { status: 400 },
          );
        }
      }
    }

    const data: {
      estado?: "PENDIENTE" | "CONFIRMADA" | "FINALIZADA" | "CANCELADA";
      fecha?: Date;
      duracion?: number;
      motivo?: string | null;
      notas?: string | null;
      usuarioId?: number | null;
      tatuajeId?: string | null;
    } = {};

    if (body.estado) data.estado = body.estado;
    if (body.fecha) data.fecha = new Date(body.fecha);
    if (body.duracion) data.duracion = Number(body.duracion);
    if (body.motivo !== undefined) {
      data.motivo = String(body.motivo).trim() || null;
    }
    if (body.notas !== undefined) {
      data.notas = String(body.notas).trim() || null;
    }
    if (body.usuarioId !== undefined) {
      data.usuarioId = body.usuarioId ? Number(body.usuarioId) : null;
    }
    if (authResult.user.rol === "TATUADOR") {
      data.usuarioId = Number(authResult.user.id);
    }
    if (body.tatuajeId !== undefined) {
      data.tatuajeId = body.tatuajeId ? String(body.tatuajeId) : null;
      if (data.tatuajeId) {
        const tatuaje = await prisma.tatuaje.findFirst({
          where: {
            id: data.tatuajeId,
            clienteId: existe.clienteId,
            estudioId: authResult.user.estudioId,
            eliminadoEn: null,
          },
        });
        if (!tatuaje) {
          return NextResponse.json(
            { error: "Tatuaje no válido para este cliente." },
            { status: 400 },
          );
        }
      }
    }

    const fecha = data.fecha ?? existe.fecha;
    const duracion = data.duracion ?? existe.duracion;
    const usuarioId =
      data.usuarioId !== undefined ? data.usuarioId : existe.usuarioId;
    const { inicio, fin } = intervaloCita(fecha, duracion);

    const choque = await hayChoqueCita({
      estudioId: authResult.user.estudioId,
      usuarioId,
      inicio,
      fin,
      excluirCitaId: id,
    });

    if (choque) {
      return NextResponse.json({ error: choque }, { status: 409 });
    }

    const cita = await prisma.cita.update({
      where: { id },
      data,
      select: seleccionarCita(),
    });

    if (cita.estado === "CONFIRMADA") {
      await programarRecordatorio(id, authResult.user.estudioId);
    }

    return NextResponse.json(cita);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar la cita." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido." }, { status: 400 });
  }

  const existe = await prisma.cita.findFirst({
    where: {
      id,
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
  });

  if (!existe) {
    return NextResponse.json(
      { error: "Cita no encontrada." },
      { status: 404 },
    );
  }

  await prisma.cita.update({
    where: { id },
    data: { eliminadoEn: new Date(), estado: "CANCELADA" },
  });

  return NextResponse.json({ ok: true });
}
