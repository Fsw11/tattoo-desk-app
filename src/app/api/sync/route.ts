import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

function sinceDate(value: string | null) {
  if (!value) return new Date(0);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const since = sinceDate(request.nextUrl.searchParams.get("since"));
  const estudioId = authResult.user.estudioId;

  const [clientes, citas, tatuajes, pagos, fotos, consentimientos, bloqueos, horarios] =
    await Promise.all([
      prisma.cliente.findMany({
        where: { estudioId, actualizadoEn: { gt: since } },
      }),
      prisma.cita.findMany({
        where: { estudioId, actualizadoEn: { gt: since } },
      }),
      prisma.tatuaje.findMany({
        where: { estudioId, actualizadoEn: { gt: since } },
      }),
      prisma.pago.findMany({
        where: { estudioId, actualizadoEn: { gt: since } },
      }),
      prisma.foto.findMany({
        where: { estudioId, actualizadoEn: { gt: since } },
      }),
      prisma.consentimiento.findMany({
        where: { estudioId, actualizadoEn: { gt: since } },
      }),
      prisma.bloqueoAgenda.findMany({
        where: { estudioId, actualizadoEn: { gt: since } },
      }),
      prisma.horarioEstudio.findMany({
        where: { estudioId, actualizadoEn: { gt: since } },
      }),
    ]);

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    changes: {
      clientes,
      citas,
      tatuajes,
      pagos,
      fotos,
      consentimientos,
      bloqueos,
      horarios,
    },
  });
}

type Mutacion = {
  entity: string;
  op: "upsert" | "delete";
  id: string;
  data?: Record<string, unknown>;
  actualizadoEn?: string;
};

export async function POST(request: NextRequest) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const mutaciones: Mutacion[] = Array.isArray(body.mutations)
      ? body.mutations
      : [];
    const resultados: Array<{ id: string; ok: boolean; error?: string }> = [];
    const estudioId = authResult.user.estudioId;

    for (const mut of mutaciones) {
      try {
        if (mut.entity === "cliente") {
          if (mut.op === "delete") {
            await prisma.cliente.updateMany({
              where: { id: mut.id, estudioId },
              data: { eliminadoEn: new Date() },
            });
          } else if (mut.data) {
            const d = mut.data;
            await prisma.cliente.upsert({
              where: { id: mut.id },
              create: {
                id: mut.id,
                nombre: String(d.nombre ?? ""),
                telefono: String(d.telefono ?? ""),
                email: d.email ? String(d.email) : null,
                instagram: d.instagram ? String(d.instagram) : null,
                direccion: d.direccion ? String(d.direccion) : null,
                alergias: d.alergias ? String(d.alergias) : null,
                enfermedades: d.enfermedades ? String(d.enfermedades) : null,
                notas: d.notas ? String(d.notas) : null,
                estudioId,
              },
              update: {
                nombre: String(d.nombre ?? ""),
                telefono: String(d.telefono ?? ""),
                email: d.email ? String(d.email) : null,
                instagram: d.instagram ? String(d.instagram) : null,
                direccion: d.direccion ? String(d.direccion) : null,
                alergias: d.alergias ? String(d.alergias) : null,
                enfermedades: d.enfermedades ? String(d.enfermedades) : null,
                notas: d.notas ? String(d.notas) : null,
                eliminadoEn: null,
              },
            });
          }
        } else if (mut.entity === "cita" && mut.data) {
          const d = mut.data;
          if (mut.op === "delete") {
            await prisma.cita.updateMany({
              where: { id: mut.id, estudioId },
              data: { eliminadoEn: new Date(), estado: "CANCELADA" },
            });
          } else {
            await prisma.cita.upsert({
              where: { id: mut.id },
              create: {
                id: mut.id,
                fecha: new Date(String(d.fecha)),
                duracion: Number(d.duracion ?? 120),
                motivo: d.motivo ? String(d.motivo) : null,
                notas: d.notas ? String(d.notas) : null,
                estado: (d.estado as "PENDIENTE") || "PENDIENTE",
                estudioId,
                clienteId: String(d.clienteId),
                usuarioId: d.usuarioId ? Number(d.usuarioId) : null,
              },
              update: {
                fecha: new Date(String(d.fecha)),
                duracion: Number(d.duracion ?? 120),
                motivo: d.motivo ? String(d.motivo) : null,
                notas: d.notas ? String(d.notas) : null,
                estado: d.estado as "PENDIENTE" | "CONFIRMADA" | "FINALIZADA" | "CANCELADA",
                eliminadoEn: null,
              },
            });
          }
        } else if (mut.entity === "pago" && mut.data && mut.op === "upsert") {
          const d = mut.data;
          await prisma.pago.upsert({
            where: { id: mut.id },
            create: {
              id: mut.id,
              monto: Number(d.monto),
              metodo: (d.metodo as "EFECTIVO") || "EFECTIVO",
              concepto: d.concepto ? String(d.concepto) : null,
              notas: d.notas ? String(d.notas) : null,
              fecha: d.fecha ? new Date(String(d.fecha)) : new Date(),
              estudioId,
              clienteId: d.clienteId ? String(d.clienteId) : null,
              tatuajeId: d.tatuajeId ? String(d.tatuajeId) : null,
              usuarioId: Number(authResult.user.id),
            },
            update: {
              monto: Number(d.monto),
              metodo: (d.metodo as "EFECTIVO") || "EFECTIVO",
              concepto: d.concepto ? String(d.concepto) : null,
              notas: d.notas ? String(d.notas) : null,
              eliminadoEn: null,
            },
          });
        } else if (mut.entity === "consentimiento" && mut.data && mut.op === "upsert") {
          const d = mut.data;
          await prisma.consentimiento.upsert({
            where: { id: mut.id },
            create: {
              id: mut.id,
              textoPlantilla: String(d.textoPlantilla ?? ""),
              firmaUrl: String(d.firmaUrl ?? ""),
              estudioId,
              clienteId: String(d.clienteId),
              citaId: d.citaId ? String(d.citaId) : null,
            },
            update: {
              textoPlantilla: String(d.textoPlantilla ?? ""),
              firmaUrl: String(d.firmaUrl ?? ""),
              eliminadoEn: null,
            },
          });
        }

        resultados.push({ id: mut.id, ok: true });
      } catch (error) {
        console.error("Sync mutación fallida", mut, error);
        resultados.push({
          id: mut.id,
          ok: false,
          error: error instanceof Error ? error.message : "Error",
        });
      }
    }

    return NextResponse.json({ results: resultados });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo sincronizar." },
      { status: 500 },
    );
  }
}
