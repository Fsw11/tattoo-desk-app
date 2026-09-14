import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { assertFeature } from "@/lib/limites";

/**
 * Registra en una transacción: N salidas de inventario (+ opcional pago)
 * vinculadas a un tatuaje/cliente.
 */
export async function POST(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const feat = await assertFeature(authResult.user.estudioId, "pos");
  if (feat) {
    return NextResponse.json({ error: feat }, { status: 402 });
  }

  try {
    const body = await request.json();
    const clienteId = body.clienteId ? String(body.clienteId) : null;
    const tatuajeId = body.tatuajeId ? String(body.tatuajeId) : null;
    let tatuadorId = body.tatuadorId ? Number(body.tatuadorId) : null;
    if (authResult.user.rol === "TATUADOR") {
      tatuadorId = Number(authResult.user.id);
    }
    const items: Array<{ inventarioId: number; cantidad: number }> =
      Array.isArray(body.materiales) ? body.materiales : [];
    const pago = body.pago as
      | { monto: number; metodo: string; concepto?: string }
      | undefined;

    if (items.length === 0 && !pago) {
      return NextResponse.json(
        { error: "Agrega materiales o un cobro." },
        { status: 400 },
      );
    }

    if (tatuajeId) {
      const tatuaje = await prisma.tatuaje.findFirst({
        where: {
          id: tatuajeId,
          estudioId: authResult.user.estudioId,
          eliminadoEn: null,
        },
      });
      if (!tatuaje) {
        return NextResponse.json(
          { error: "Tatuaje no encontrado." },
          { status: 404 },
        );
      }

      if (tatuadorId) {
        const artista = await prisma.usuario.findFirst({
          where: {
            id: tatuadorId,
            estudioId: authResult.user.estudioId,
            activo: true,
            eliminadoEn: null,
          },
        });
        if (!artista) {
          return NextResponse.json(
            { error: "Tatuador no válido." },
            { status: 400 },
          );
        }
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      if (tatuajeId && tatuadorId) {
        await tx.tatuaje.update({
          where: { id: tatuajeId },
          data: { usuarioId: tatuadorId },
        });
      }

      const movimientos = [];

      for (const item of items) {
        const inventarioId = Number(item.inventarioId);
        const cantidad = Number(item.cantidad);
        if (!inventarioId || !cantidad || cantidad <= 0) {
          throw new Error("Material o cantidad inválida.");
        }

        const inv = await tx.inventario.findFirst({
          where: {
            id: inventarioId,
            estudioId: authResult.user.estudioId,
            activo: true,
            eliminadoEn: null,
          },
        });
        if (!inv) throw new Error("Material no encontrado.");

        const stock = Number(inv.cantidad);
        if (stock < cantidad) {
          throw new Error(`Stock insuficiente de ${inv.nombre}.`);
        }

        const costoUnitario = inv.costo !== null ? Number(inv.costo) : 0;
        await tx.inventario.update({
          where: { id: inv.id },
          data: { cantidad: stock - cantidad },
        });

        const mov = await tx.movimientoInventario.create({
          data: {
            tipo: "SALIDA",
            cantidad,
            costoUnitario,
            costoTotal: costoUnitario * cantidad,
            motivo: "Sesión POS",
            estudioId: authResult.user.estudioId,
            inventarioId: inv.id,
            tatuajeId,
            usuarioId: Number(authResult.user.id),
          },
        });
        movimientos.push(mov);
      }

      let pagoCreado = null;
      if (pago && Number(pago.monto) > 0) {
        const metodo = String(pago.metodo || "EFECTIVO");
        const metodos = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "OTRO"];
        if (!metodos.includes(metodo)) {
          throw new Error("Método de pago inválido.");
        }
        pagoCreado = await tx.pago.create({
          data: {
            monto: Number(pago.monto),
            metodo: metodo as "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "OTRO",
            concepto: pago.concepto || "Sesión",
            estudioId: authResult.user.estudioId,
            clienteId,
            tatuajeId,
            usuarioId: Number(authResult.user.id),
          },
        });
      }

      return { movimientos, pago: pagoCreado };
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la sesión.",
      },
      { status: 400 },
    );
  }
}
