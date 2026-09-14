import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const esTatuador = authResult.user.rol === "TATUADOR";
  const userId = Number(authResult.user.id);

  const tatuajes = await prisma.tatuaje.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
      ...(esTatuador ? { usuarioId: userId } : {}),
    },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      estilo: true,
      zona: true,
      precio: true,
      anticipo: true,
      estado: true,
      notas: true,
      creadoEn: true,
      actualizadoEn: true,
      cliente: { select: { id: true, nombre: true } },
      usuario: { select: { id: true, nombre: true } },
      pagos: {
        where: { eliminadoEn: null },
        orderBy: { fecha: "desc" },
        select: {
          id: true,
          monto: true,
          fecha: true,
          metodo: true,
          concepto: true,
        },
      },
      fotos: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: "desc" },
        select: {
          id: true,
          url: true,
          descripcion: true,
          tipo: true,
          creadoEn: true,
        },
      },
    },
  });

  return NextResponse.json(tatuajes);
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const id =
      typeof body.id === "string" && body.id.length > 0
        ? body.id
        : crypto.randomUUID();
    const clienteId = String(body.clienteId ?? "");
    const nombre = String(body.nombre ?? "").trim();

    if (!clienteId || !nombre) {
      return NextResponse.json(
        { error: "Cliente y nombre son obligatorios." },
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

    const tatuaje = await prisma.tatuaje.create({
      data: {
        id,
        nombre,
        descripcion: body.descripcion
          ? String(body.descripcion).trim()
          : null,
        estilo: body.estilo ? String(body.estilo).trim() : null,
        zona: body.zona ? String(body.zona).trim() : null,
        precio: body.precio !== undefined && body.precio !== ""
          ? Number(body.precio)
          : null,
        anticipo:
          body.anticipo !== undefined && body.anticipo !== ""
            ? Number(body.anticipo)
            : null,
        estado: body.estado || "PENDIENTE",
        notas: body.notas ? String(body.notas).trim() : null,
        estudioId: authResult.user.estudioId,
        clienteId,
        usuarioId: body.usuarioId ? Number(body.usuarioId) : null,
      },
    });

    return NextResponse.json(tatuaje, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo crear el tatuaje." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    if (!id) {
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }

    const existe = await prisma.tatuaje.findFirst({
      where: {
        id,
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
      },
    });

    if (!existe) {
      return NextResponse.json(
        { error: "Tatuaje no encontrado." },
        { status: 404 },
      );
    }

    const tatuaje = await prisma.tatuaje.update({
      where: { id },
      data: {
        nombre: body.nombre !== undefined
          ? String(body.nombre).trim()
          : undefined,
        descripcion:
          body.descripcion !== undefined
            ? String(body.descripcion).trim() || null
            : undefined,
        estilo:
          body.estilo !== undefined
            ? String(body.estilo).trim() || null
            : undefined,
        zona:
          body.zona !== undefined
            ? String(body.zona).trim() || null
            : undefined,
        precio:
          body.precio !== undefined
            ? body.precio === "" || body.precio === null
              ? null
              : Number(body.precio)
            : undefined,
        anticipo:
          body.anticipo !== undefined
            ? body.anticipo === "" || body.anticipo === null
              ? null
              : Number(body.anticipo)
            : undefined,
        estado: body.estado || undefined,
        notas:
          body.notas !== undefined
            ? String(body.notas).trim() || null
            : undefined,
        usuarioId:
          body.usuarioId !== undefined
            ? body.usuarioId
              ? Number(body.usuarioId)
              : null
            : undefined,
      },
    });

    return NextResponse.json(tatuaje);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar el tatuaje." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido." }, { status: 400 });
  }

  const existe = await prisma.tatuaje.findFirst({
    where: {
      id,
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
  });

  if (!existe) {
    return NextResponse.json(
      { error: "Tatuaje no encontrado." },
      { status: 404 },
    );
  }

  const ahora = new Date();
  await prisma.$transaction([
    prisma.tatuaje.update({
      where: { id },
      data: { eliminadoEn: ahora },
    }),
    prisma.foto.updateMany({
      where: { tatuajeId: id, eliminadoEn: null },
      data: { eliminadoEn: ahora },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
