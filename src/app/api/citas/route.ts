import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const estadosPermitidos = [
  "PENDIENTE",
  "CONFIRMADA",
  "FINALIZADA",
  "CANCELADA",
] as const;

function seleccionarCita() {
  return {
    id: true,
    fecha: true,
    duracion: true,
    motivo: true,
    notas: true,
    estado: true,
    cliente: {
      select: {
        id: true,
        nombre: true,
        telefono: true,
      },
    },
    usuario: {
      select: {
        id: true,
        nombre: true,
      },
    },
  } as const;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const citas = await prisma.cita.findMany({
    where: {
      estudioId: session.user.estudioId,
    },
    orderBy: {
      fecha: "asc",
    },
    select: seleccionarCita(),
  });

  return NextResponse.json(citas);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const clienteId = Number(body.clienteId);
    const duracion = Number(body.duracion ?? 120);
    const fechaTexto = String(body.fecha ?? "").trim();
    const motivo = String(body.motivo ?? "").trim() || null;
    const notas = String(body.notas ?? "").trim() || null;

    if (!Number.isInteger(clienteId) || clienteId <= 0) {
      return NextResponse.json(
        { error: "Selecciona un cliente válido." },
        { status: 400 }
      );
    }

    if (!fechaTexto) {
      return NextResponse.json(
        { error: "La fecha y hora son obligatorias." },
        { status: 400 }
      );
    }

    const fecha = new Date(fechaTexto);

    if (Number.isNaN(fecha.getTime())) {
      return NextResponse.json(
        { error: "La fecha y hora no son válidas." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(duracion) || duracion <= 0 || duracion > 1440) {
      return NextResponse.json(
        { error: "La duración debe estar entre 1 y 1440 minutos." },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        estudioId: session.user.estudioId,
      },
      select: { id: true },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "El cliente no pertenece a este estudio." },
        { status: 404 }
      );
    }

    let usuarioId: number | null = Number(session.user.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      usuarioId = null;
    }

    if (
      body.usuarioId !== undefined &&
      body.usuarioId !== null &&
      body.usuarioId !== ""
    ) {
      const solicitado = Number(body.usuarioId);

      if (!Number.isInteger(solicitado) || solicitado <= 0) {
        return NextResponse.json(
          { error: "El tatuador seleccionado no es válido." },
          { status: 400 }
        );
      }

      const usuario = await prisma.usuario.findFirst({
        where: {
          id: solicitado,
          estudioId: session.user.estudioId,
          activo: true,
        },
        select: { id: true },
      });

      if (!usuario) {
        return NextResponse.json(
          { error: "El tatuador seleccionado no pertenece al estudio." },
          { status: 404 }
        );
      }

      usuarioId = usuario.id;
    }

    const cita = await prisma.cita.create({
      data: {
        fecha,
        duracion: Math.round(duracion),
        motivo,
        notas,
        estudioId: session.user.estudioId,
        clienteId,
        usuarioId,
      },
      select: seleccionarCita(),
    });

    return NextResponse.json(cita, { status: 201 });
  } catch (error) {
    console.error("Error creando cita:", error);

    return NextResponse.json(
      { error: "No se pudo crear la cita." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const citaId = Number(body.id);

    if (!Number.isInteger(citaId) || citaId <= 0) {
      return NextResponse.json(
        { error: "ID de cita inválido." },
        { status: 400 }
      );
    }

    const existente = await prisma.cita.findFirst({
      where: {
        id: citaId,
        estudioId: session.user.estudioId,
      },
      select: { id: true },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Cita no encontrada." },
        { status: 404 }
      );
    }

    const data: {
      estado?: (typeof estadosPermitidos)[number];
      fecha?: Date;
      duracion?: number;
      motivo?: string | null;
      notas?: string | null;
    } = {};

    if (body.estado !== undefined) {
      if (!estadosPermitidos.includes(body.estado)) {
        return NextResponse.json(
          { error: "El estado de la cita no es válido." },
          { status: 400 }
        );
      }

      data.estado = body.estado;
    }

    if (body.fecha !== undefined) {
      const fecha = new Date(String(body.fecha));

      if (Number.isNaN(fecha.getTime())) {
        return NextResponse.json(
          { error: "La fecha y hora no son válidas." },
          { status: 400 }
        );
      }

      data.fecha = fecha;
    }

    if (body.duracion !== undefined) {
      const duracion = Number(body.duracion);

      if (
        !Number.isFinite(duracion) ||
        duracion <= 0 ||
        duracion > 1440
      ) {
        return NextResponse.json(
          { error: "La duración debe estar entre 1 y 1440 minutos." },
          { status: 400 }
        );
      }

      data.duracion = Math.round(duracion);
    }

    if (body.motivo !== undefined) {
      data.motivo = String(body.motivo ?? "").trim() || null;
    }

    if (body.notas !== undefined) {
      data.notas = String(body.notas ?? "").trim() || null;
    }

    const cita = await prisma.cita.update({
      where: { id: citaId },
      data,
      select: seleccionarCita(),
    });

    return NextResponse.json(cita);
  } catch (error) {
    console.error("Error actualizando cita:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar la cita." },
      { status: 500 }
    );
  }
}
