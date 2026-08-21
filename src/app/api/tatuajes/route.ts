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

  const tatuajes = await prisma.tatuaje.findMany({
    where: {
      estudioId: session.user.estudioId,
    },
    orderBy: {
      creadoEn: "desc",
    },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      estilo: true,
      zona: true,
      precio: true,
      anticipo: true,
      estado: true,
      notas: true,
      creadoEn: true,
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

  return NextResponse.json(tatuajes);
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

    const nombre = String(body.nombre ?? "").trim();
    const clienteId = Number(body.clienteId);

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del tatuaje es obligatorio." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(clienteId)) {
      return NextResponse.json(
        { error: "Cliente inválido." },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        estudioId: session.user.estudioId,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "El cliente no pertenece a este estudio." },
        { status: 404 }
      );
    }

    const tatuaje = await prisma.tatuaje.create({
      data: {
        nombre,

        descripcion:
          String(body.descripcion ?? "").trim() || null,

        estilo:
          String(body.estilo ?? "").trim() || null,

        zona:
          String(body.zona ?? "").trim() || null,

        precio:
          body.precio !== undefined &&
          body.precio !== ""
            ? Number(body.precio)
            : null,

        anticipo:
          body.anticipo !== undefined &&
          body.anticipo !== ""
            ? Number(body.anticipo)
            : null,

        estado: body.estado || "PENDIENTE",

        notas:
          String(body.notas ?? "").trim() || null,

        estudioId: session.user.estudioId,
        clienteId: cliente.id,

        usuarioId: session.user.id
          ? Number(session.user.id)
          : null,
      },

      select: {
        id: true,
        nombre: true,
        descripcion: true,
        estilo: true,
        zona: true,
        precio: true,
        anticipo: true,
        estado: true,
        notas: true,
        creadoEn: true,

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

    return NextResponse.json(tatuaje, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "No se pudo crear el tatuaje.",
      },
      {
        status: 500,
      }
    );
  }
}
