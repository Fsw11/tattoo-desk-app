import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 36 * 60 * 60 * 1000);

  const recordatorios = await prisma.recordatorioCita.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      estado: "PENDIENTE",
      programadoPara: { lte: en24h },
    },
    orderBy: { programadoPara: "asc" },
    include: {
      cita: {
        include: {
          cliente: { select: { id: true, nombre: true, telefono: true } },
        },
      },
    },
  });

  return NextResponse.json(recordatorios);
}

export async function PATCH(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    const estado = String(body.estado ?? "");

    if (!id || !["ENVIADO", "CANCELADO", "FALLIDO"].includes(estado)) {
      return NextResponse.json(
        { error: "Datos inválidos." },
        { status: 400 },
      );
    }

    const existe = await prisma.recordatorioCita.findFirst({
      where: { id, estudioId: authResult.user.estudioId },
    });

    if (!existe) {
      return NextResponse.json(
        { error: "Recordatorio no encontrado." },
        { status: 404 },
      );
    }

    const actualizado = await prisma.recordatorioCita.update({
      where: { id },
      data: {
        estado: estado as "ENVIADO" | "CANCELADO" | "FALLIDO",
        enviadoEn: estado === "ENVIADO" ? new Date() : existe.enviadoEn,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar el recordatorio." },
      { status: 500 },
    );
  }
}

/** Procesa recordatorios vencidos: marca listos y expone wa.me */
export async function POST() {
  const authResult = await requireSession(["ADMIN", "RECEPCION"]);
  if (!authResult.ok) return authResult.response;

  const ahora = new Date();
  const pendientes = await prisma.recordatorioCita.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      estado: "PENDIENTE",
      programadoPara: { lte: ahora },
    },
    include: {
      cita: {
        include: {
          cliente: { select: { nombre: true, telefono: true } },
        },
      },
    },
  });

  return NextResponse.json({
    listos: pendientes.map((r) => ({
      id: r.id,
      mensaje: r.mensaje,
      urlWhatsapp: r.urlWhatsapp,
      cliente: r.cita.cliente.nombre,
      telefono: r.cita.cliente.telefono,
    })),
  });
}
