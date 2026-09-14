import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  const gastos = await prisma.gasto.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
    orderBy: { fecha: "desc" },
    select: {
      id: true,
      concepto: true,
      descripcion: true,
      monto: true,
      fecha: true,
      categoria: true,
      notas: true,
      usuario: { select: { id: true, nombre: true } },
    },
  });

  return NextResponse.json(gastos);
}

export async function POST(request: Request) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const concepto = String(body.concepto ?? "").trim();
    const monto = Number(body.monto);
    const categoriasPermitidas = [
      "MATERIAL",
      "EQUIPO",
      "RENTA",
      "SERVICIOS",
      "MARKETING",
      "OTRO",
    ];

    if (!concepto) {
      return NextResponse.json(
        { error: "El concepto es obligatorio." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a cero." },
        { status: 400 },
      );
    }

    if (!categoriasPermitidas.includes(body.categoria)) {
      return NextResponse.json(
        { error: "La categoría no es válida." },
        { status: 400 },
      );
    }

    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        descripcion: String(body.descripcion ?? "").trim() || null,
        monto,
        categoria: body.categoria,
        notas: String(body.notas ?? "").trim() || null,
        estudioId: authResult.user.estudioId,
        usuarioId: Number(authResult.user.id),
      },
      select: {
        id: true,
        concepto: true,
        descripcion: true,
        monto: true,
        fecha: true,
        categoria: true,
        notas: true,
        usuario: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(gasto, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo registrar el gasto." },
      { status: 500 },
    );
  }
}
