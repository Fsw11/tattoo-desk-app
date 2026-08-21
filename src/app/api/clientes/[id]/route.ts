import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Contexto = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
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
  const clienteId = Number(id);

  if (!Number.isInteger(clienteId)) {
    return NextResponse.json(
      { error: "ID de cliente inválido." },
      { status: 400 }
    );
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      id: clienteId,
      estudioId: session.user.estudioId,
    },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      email: true,
      instagram: true,
      direccion: true,
      alergias: true,
      enfermedades: true,
      notas: true,
      creadoEn: true,
      actualizadoEn: true,
    },
  });

  if (!cliente) {
    return NextResponse.json(
      { error: "Cliente no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(cliente);
}
