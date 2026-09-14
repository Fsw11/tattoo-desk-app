import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** Lista lite de artistas activos del estudio (para selectores). */
export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  // Tatuador solo se ve a sí mismo (no elige otros).
  if (authResult.user.rol === "TATUADOR") {
    const yo = await prisma.usuario.findFirst({
      where: {
        id: Number(authResult.user.id),
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
        activo: true,
      },
      select: { id: true, nombre: true, rol: true },
    });
    return NextResponse.json(yo ? [yo] : []);
  }

  const usuarios = await prisma.usuario.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
      activo: true,
      rol: { in: ["ADMIN", "TATUADOR"] },
    },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      rol: true,
    },
  });

  return NextResponse.json(usuarios);
}
