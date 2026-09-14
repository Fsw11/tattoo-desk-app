import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const inventario = await prisma.inventario.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(inventario);
}

export async function POST(request: Request) {
  const authResult = await requireSession(["ADMIN", "TATUADOR"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const cantidad = Number(body.cantidad ?? 0);

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio." },
        { status: 400 },
      );
    }

    const item = await prisma.inventario.create({
      data: {
        nombre,
        descripcion: body.descripcion
          ? String(body.descripcion).trim()
          : null,
        categoria: body.categoria ? String(body.categoria).trim() : null,
        cantidad,
        unidad: body.unidad ? String(body.unidad).trim() : null,
        minimo:
          body.minimo !== undefined && body.minimo !== ""
            ? Number(body.minimo)
            : null,
        costo:
          body.costo !== undefined && body.costo !== ""
            ? Number(body.costo)
            : null,
        estudioId: authResult.user.estudioId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo crear el material." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireSession(["ADMIN", "TATUADOR"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }

    const existe = await prisma.inventario.findFirst({
      where: {
        id,
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
      },
    });
    if (!existe) {
      return NextResponse.json(
        { error: "Material no encontrado." },
        { status: 404 },
      );
    }

    const item = await prisma.inventario.update({
      where: { id },
      data: {
        nombre:
          body.nombre !== undefined
            ? String(body.nombre).trim()
            : undefined,
        descripcion:
          body.descripcion !== undefined
            ? String(body.descripcion).trim() || null
            : undefined,
        categoria:
          body.categoria !== undefined
            ? String(body.categoria).trim() || null
            : undefined,
        unidad:
          body.unidad !== undefined
            ? String(body.unidad).trim() || null
            : undefined,
        minimo:
          body.minimo !== undefined
            ? body.minimo === "" || body.minimo === null
              ? null
              : Number(body.minimo)
            : undefined,
        costo:
          body.costo !== undefined
            ? body.costo === "" || body.costo === null
              ? null
              : Number(body.costo)
            : undefined,
        activo:
          body.activo !== undefined ? Boolean(body.activo) : undefined,
        eliminadoEn:
          body.eliminar === true ? new Date() : undefined,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar." },
      { status: 500 },
    );
  }
}
