import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { assertDentroDeLimite } from "@/lib/limites";

export async function GET(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");
    const tatuajeId = searchParams.get("tatuajeId");

    const fotos = await prisma.foto.findMany({
      where: {
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
        ...(clienteId ? { clienteId } : {}),
        ...(tatuajeId ? { tatuajeId } : {}),
      },
      orderBy: { creadoEn: "desc" },
      select: {
        id: true,
        url: true,
        descripcion: true,
        tipo: true,
        creadoEn: true,
        clienteId: true,
        tatuajeId: true,
        cliente: { select: { id: true, nombre: true } },
        tatuaje: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(fotos);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudieron cargar las fotos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const limite = await assertDentroDeLimite(
      authResult.user.estudioId,
      "fotos",
    );
    if (limite) {
      return NextResponse.json({ error: limite }, { status: 402 });
    }

    const body = await request.json();
    const id =
      typeof body.id === "string" && body.id.length > 0
        ? body.id
        : crypto.randomUUID();
    const url = String(body.url ?? "").trim();
    const clienteId = String(body.clienteId ?? "");

    if (!url || !clienteId) {
      return NextResponse.json(
        { error: "URL y cliente son obligatorios." },
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

    const foto = await prisma.foto.create({
      data: {
        id,
        url,
        descripcion: body.descripcion
          ? String(body.descripcion).trim()
          : null,
        tipo: body.tipo || "TATUAJE",
        estudioId: authResult.user.estudioId,
        clienteId,
        tatuajeId: body.tatuajeId ? String(body.tatuajeId) : null,
      },
    });

    return NextResponse.json(foto, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo guardar la foto." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido." }, { status: 400 });
  }

  const existe = await prisma.foto.findFirst({
    where: {
      id,
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
  });

  if (!existe) {
    return NextResponse.json(
      { error: "Foto no encontrada." },
      { status: 404 },
    );
  }

  await prisma.foto.update({
    where: { id },
    data: { eliminadoEn: new Date() },
  });

  return NextResponse.json({ ok: true });
}
