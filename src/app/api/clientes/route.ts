import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { assertDentroDeLimite } from "@/lib/limites";

export async function GET(request: NextRequest) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const lite = searchParams.get("lite") === "1";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 50)));
  const filtro = searchParams.get("filtro"); // alergias | activos | firmados

  const and: Prisma.ClienteWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q } },
        { instagram: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (filtro === "alergias") {
    and.push({
      OR: [{ alergias: { not: null } }, { enfermedades: { not: null } }],
    });
  } else if (filtro === "activos") {
    and.push({
      tatuajes: {
        some: {
          eliminadoEn: null,
          estado: { in: ["PENDIENTE", "EN_PROCESO"] },
        },
      },
    });
  } else if (filtro === "firmados") {
    and.push({
      consentimientos: {
        some: { eliminadoEn: null },
      },
    });
  }

  const whereBase: Prisma.ClienteWhereInput = {
    estudioId: authResult.user.estudioId,
    eliminadoEn: null,
    ...(and.length ? { AND: and } : {}),
  };

  if (lite) {
    const [total, clientes] = await Promise.all([
      prisma.cliente.count({ where: whereBase }),
      prisma.cliente.findMany({
        where: whereBase,
        orderBy: { nombre: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nombre: true,
          telefono: true,
          email: true,
          instagram: true,
          alergias: true,
          enfermedades: true,
          creadoEn: true,
          _count: {
            select: {
              tatuajes: {
                where: { eliminadoEn: null },
              },
              consentimientos: {
                where: { eliminadoEn: null },
              },
            },
          },
          tatuajes: {
            where: {
              eliminadoEn: null,
              estado: { in: ["PENDIENTE", "EN_PROCESO"] },
            },
            take: 1,
            select: { id: true, nombre: true, estado: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      page,
      limit,
      clientes: clientes.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email,
        instagram: c.instagram,
        tieneAlergias: Boolean(c.alergias || c.enfermedades),
        tatuajesCount: c._count.tatuajes,
        firmasCount: c._count.consentimientos,
        tatuajeActivo: c.tatuajes[0] || null,
        creadoEn: c.creadoEn,
      })),
    });
  }

  const clientes = await prisma.cliente.findMany({
    where: whereBase,
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      email: true,
      instagram: true,
      direccion: true,
      alergias: true,
      enfermedades: true,
      notas: true,
      creadoEn: true,
      actualizadoEn: true,
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
      tatuajes: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: "desc" },
        select: {
          id: true,
          nombre: true,
          estilo: true,
          zona: true,
          precio: true,
          anticipo: true,
          estado: true,
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
      },
      consentimientos: {
        where: { eliminadoEn: null },
        orderBy: { firmadoEn: "desc" },
        take: 1,
        select: { id: true, firmadoEn: true },
      },
    },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const limite = await assertDentroDeLimite(
      authResult.user.estudioId,
      "clientes",
    );
    if (limite) {
      return NextResponse.json({ error: limite }, { status: 402 });
    }

    const body = await request.json();
    const id =
      typeof body.id === "string" && body.id.length > 0
        ? body.id
        : crypto.randomUUID();
    const nombre = String(body.nombre ?? "").trim();
    const telefono = String(body.telefono ?? "").trim();

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: "Nombre y teléfono son obligatorios." },
        { status: 400 },
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        id,
        nombre,
        telefono,
        email: body.email ? String(body.email).trim() : null,
        instagram: body.instagram ? String(body.instagram).trim() : null,
        direccion: body.direccion ? String(body.direccion).trim() : null,
        alergias: body.alergias ? String(body.alergias).trim() : null,
        enfermedades: body.enfermedades
          ? String(body.enfermedades).trim()
          : null,
        notas: body.notas ? String(body.notas).trim() : null,
        estudioId: authResult.user.estudioId,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Error creando cliente:", error);
    return NextResponse.json(
      { error: "No se pudo crear el cliente." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const clienteId = String(body.id ?? "");

    if (!clienteId) {
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }

    const existe = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
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

    const nombre = String(body.nombre ?? "").trim();
    const telefono = String(body.telefono ?? "").trim();

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: "Nombre y teléfono son obligatorios." },
        { status: 400 },
      );
    }

    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nombre,
        telefono,
        email: body.email ? String(body.email).trim() : null,
        instagram: body.instagram ? String(body.instagram).trim() : null,
        direccion: body.direccion ? String(body.direccion).trim() : null,
        alergias: body.alergias ? String(body.alergias).trim() : null,
        enfermedades: body.enfermedades
          ? String(body.enfermedades).trim()
          : null,
        notas: body.notas ? String(body.notas).trim() : null,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el cliente." },
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

  await prisma.cliente.update({
    where: { id },
    data: { eliminadoEn: new Date() },
  });

  return NextResponse.json({ ok: true });
}
