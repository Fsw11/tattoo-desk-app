import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { hayChoqueCita } from "@/lib/agenda-server";
import { intervaloCita } from "@/lib/agenda-core";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  try {
    const body = await request.json();
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

    const fecha = body.fecha ? new Date(body.fecha) : existe.fecha;
    const duracion = body.duracion ? Number(body.duracion) : existe.duracion;
    const usuarioId =
      body.usuarioId !== undefined
        ? body.usuarioId
          ? Number(body.usuarioId)
          : null
        : existe.usuarioId;

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
      data: {
        fecha,
        duracion,
        motivo:
          body.motivo !== undefined
            ? String(body.motivo).trim() || null
            : undefined,
        notas:
          body.notas !== undefined
            ? String(body.notas).trim() || null
            : undefined,
        estado: body.estado || undefined,
        usuarioId,
        tatuajeId:
          body.tatuajeId !== undefined
            ? body.tatuajeId
              ? String(body.tatuajeId)
              : null
            : undefined,
      },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
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
        usuario: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(cita);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar la cita." },
      { status: 500 },
    );
  }
}
