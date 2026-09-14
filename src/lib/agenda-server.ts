import {
  intervaloCita,
  intervalosSeSolapan,
} from "./agenda-core";
import { prisma } from "@/lib/prisma";

export async function hayChoqueCita(params: {
  estudioId: number;
  usuarioId: number | null;
  inicio: Date;
  fin: Date;
  excluirCitaId?: string;
}): Promise<string | null> {
  const candidatos = await prisma.cita.findMany({
    where: {
      estudioId: params.estudioId,
      eliminadoEn: null,
      estado: { not: "CANCELADA" },
      ...(params.excluirCitaId ? { id: { not: params.excluirCitaId } } : {}),
      ...(params.usuarioId ? { usuarioId: params.usuarioId } : {}),
      fecha: {
        gte: new Date(params.inicio.getTime() - 24 * 60 * 60 * 1000),
        lte: new Date(params.fin.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    select: { id: true, fecha: true, duracion: true },
  });

  const propio = { inicio: params.inicio, fin: params.fin };
  for (const c of candidatos) {
    const otro = intervaloCita(new Date(c.fecha), c.duracion);
    if (intervalosSeSolapan(propio, otro)) {
      return "Hay otra cita que se solapa en ese horario.";
    }
  }

  const bloqueo = await prisma.bloqueoAgenda.findFirst({
    where: {
      estudioId: params.estudioId,
      eliminadoEn: null,
      OR: [
        { usuarioId: null },
        ...(params.usuarioId ? [{ usuarioId: params.usuarioId }] : []),
      ],
      inicio: { lt: params.fin },
      fin: { gt: params.inicio },
    },
    select: { id: true },
  });

  if (bloqueo) {
    return "Ese horario está bloqueado.";
  }

  return null;
}
