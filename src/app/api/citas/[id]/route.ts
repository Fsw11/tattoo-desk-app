import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Contexto = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: Request,
  context: Contexto
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const citaId = Number(id);

  if (!Number.isInteger(citaId)) {
    return NextResponse.json(
      { error: "ID inválido." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const estado = String(body.estado ?? "");

    const estadosValidos = [
      "PENDIENTE",
      "CONFIRMADA",
      "FINALIZADA",
      "CANCELADA",
    ];

    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    const cita = await prisma.cita.findFirst({
      where: {
        id: citaId,
        estudioId: session.user.estudioId,
      },
    });

    if (!cita) {
      return NextResponse.json(
        { error: "Cita no encontrada." },
        { status: 404 }
      );
    }

    const actualizada = await prisma.cita.update({
      where: {
        id: citaId,
      },
      data: {
        estado: estado as
          | "PENDIENTE"
          | "CONFIRMADA"
          | "FINALIZADA"
          | "CANCELADA",
      },
      select: {
        id: true,
        estado: true,
      },
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo actualizar la cita." },
      { status: 500 }
    );
  }
}
