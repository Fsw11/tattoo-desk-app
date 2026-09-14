import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const bloqueos = await prisma.bloqueoAgenda.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
    orderBy: { inicio: "asc" },
    include: {
      usuario: { select: { id: true, nombre: true } },
    },
  });

  return NextResponse.json(bloqueos);
}

export async function POST(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const inicio = new Date(body.inicio);
    const fin = new Date(body.fin);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin <= inicio) {
      return NextResponse.json(
        { error: "Rango de fechas inválido." },
        { status: 400 },
      );
    }

    const bloqueo = await prisma.bloqueoAgenda.create({
      data: {
        id: body.id || crypto.randomUUID(),
        inicio,
        fin,
        motivo: body.motivo ? String(body.motivo).trim() : null,
        estudioId: authResult.user.estudioId,
        usuarioId: body.usuarioId ? Number(body.usuarioId) : null,
      },
      include: {
        usuario: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(bloqueo, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo crear el bloqueo." },
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

  const existe = await prisma.bloqueoAgenda.findFirst({
    where: {
      id,
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
  });

  if (!existe) {
    return NextResponse.json(
      { error: "Bloqueo no encontrado." },
      { status: 404 },
    );
  }

  await prisma.bloqueoAgenda.update({
    where: { id },
    data: { eliminadoEn: new Date() },
  });

  return NextResponse.json({ ok: true });
}
