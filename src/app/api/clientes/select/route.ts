import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const clientes = await prisma.cliente.findMany({
    where: {
      estudioId: session.user.estudioId,
    },
    orderBy: {
      nombre: "asc",
    },
    select: {
      id: true,
      nombre: true,
      telefono: true,
    },
  });

  return NextResponse.json(clientes);
}
