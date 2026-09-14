import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: {
      id,
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
    include: {
      citas: {
        where: { eliminadoEn: null },
        orderBy: { fecha: "desc" },
      },
      tatuajes: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: "desc" },
      },
      pagos: {
        where: { eliminadoEn: null },
        orderBy: { fecha: "desc" },
      },
      fotos: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: "desc" },
      },
      consentimientos: {
        where: { eliminadoEn: null },
        orderBy: { firmadoEn: "desc" },
      },
    },
  });

  if (!cliente) {
    return NextResponse.json(
      { error: "Cliente no encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json(cliente);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const existe = await prisma.cliente.findFirst({
      where: {
        id,
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
      },
    });

    if (!existe) {
      return NextResponse.json(
        { error: "Cliente no encontrado." },
        { status: 404 },
      );
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: body.nombre !== undefined ? String(body.nombre).trim() : undefined,
        telefono:
          body.telefono !== undefined
            ? String(body.telefono).trim()
            : undefined,
        email:
          body.email !== undefined
            ? String(body.email).trim() || null
            : undefined,
        instagram:
          body.instagram !== undefined
            ? String(body.instagram).trim() || null
            : undefined,
        direccion:
          body.direccion !== undefined
            ? String(body.direccion).trim() || null
            : undefined,
        alergias:
          body.alergias !== undefined
            ? String(body.alergias).trim() || null
            : undefined,
        enfermedades:
          body.enfermedades !== undefined
            ? String(body.enfermedades).trim() || null
            : undefined,
        notas:
          body.notas !== undefined
            ? String(body.notas).trim() || null
            : undefined,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar." },
      { status: 500 },
    );
  }
}
