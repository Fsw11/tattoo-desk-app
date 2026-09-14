import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const pagos = await prisma.pago.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
    orderBy: { fecha: "desc" },
    select: {
      id: true,
      monto: true,
      concepto: true,
      notas: true,
      metodo: true,
      fecha: true,
      cliente: { select: { id: true, nombre: true, telefono: true } },
      tatuaje: { select: { id: true, nombre: true } },
    },
  });

  return NextResponse.json(pagos);
}

export async function POST(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const id =
      typeof body.id === "string" && body.id.length > 0
        ? body.id
        : crypto.randomUUID();
    const monto = Number(body.monto);
    const metodo = String(body.metodo ?? "EFECTIVO");

    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json(
        { error: "Monto inválido." },
        { status: 400 },
      );
    }

    const metodos = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "OTRO"];
    if (!metodos.includes(metodo)) {
      return NextResponse.json(
        { error: "Método de pago inválido." },
        { status: 400 },
      );
    }

    const clienteId = body.clienteId ? String(body.clienteId) : null;
    const tatuajeId = body.tatuajeId ? String(body.tatuajeId) : null;

    if (clienteId) {
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
    }

    const pago = await prisma.pago.create({
      data: {
        id,
        monto,
        metodo: metodo as "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "OTRO",
        concepto: body.concepto ? String(body.concepto).trim() : null,
        notas: body.notas ? String(body.notas).trim() : null,
        fecha: body.fecha ? new Date(body.fecha) : new Date(),
        estudioId: authResult.user.estudioId,
        clienteId,
        tatuajeId,
        usuarioId: Number(authResult.user.id),
      },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        tatuaje: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(pago, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo registrar el pago." },
      { status: 500 },
    );
  }
}
