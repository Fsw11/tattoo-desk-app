import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const clientes = await prisma.cliente.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, telefono: true },
  });

  return NextResponse.json(clientes);
}
