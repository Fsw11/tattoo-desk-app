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

  const citas = await prisma.cita.findMany({
    where: {
      estudioId: session.user.estudioId,
    },
    orderBy: {
      fecha: "asc",
    },
    select: {
      id: true,
      fecha: true,
      duracion: true,
      motivo: true,
      notas: true,
      estado: true,

      cliente: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      },

      usuario: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  return NextResponse.json(citas);
}
