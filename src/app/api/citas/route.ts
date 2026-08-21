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

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const clienteId = Number(body.clienteId);
    const fecha = new Date(body.fecha);
    const duracion = Number(body.duracion ?? 120);
    const motivo = String(body.motivo ?? "").trim() || null;
    const notas = String(body.notas ?? "").trim() || null;

    if (!Number.isInteger(clienteId)) {
      return NextResponse.json(
        { error: "El cliente es obligatorio." },
        { status: 400 }
      );
    }

    if (Number.isNaN(fecha.getTime())) {
      return NextResponse.json(
        { error: "La fecha de la cita no es válida." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(duracion) || duracion <= 0) {
      return NextResponse.json(
        { error: "La duración no es válida." },
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
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "El cliente no existe en este estudio." },
        { status: 404 }
      );
    }

    const cita = await prisma.cita.create({
      data: {
        fecha,
        duracion,
        motivo,
        notas,
        estado: "PENDIENTE",
        estudioId: session.user.estudioId,
        clienteId,
        usuarioId: session.user.id
          ? Number(session.user.id)
          : null,
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

    return NextResponse.json(cita, { status: 201 });
  } catch (error) {
    console.error("Error al crear cita:", error);

    return NextResponse.json(
      {
        error: "No se pudo crear la cita.",
      },
      { status: 500 }
    );
  }
}
