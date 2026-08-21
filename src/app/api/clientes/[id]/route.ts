import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Contexto = {
  params: Promise<{
    id: string;
  }>;
};

async function obtenerClienteId(context: Contexto) {
  const { id } = await context.params;
  const clienteId = Number(id);

  if (!Number.isInteger(clienteId)) {
    return null;
  }

  return clienteId;
}

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

  const clienteId = await obtenerClienteId(context);

  if (clienteId === null) {
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

  const clienteId = await obtenerClienteId(context);

  if (clienteId === null) {
    return NextResponse.json(
      { error: "ID de cliente inválido." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const nombre = String(body.nombre ?? "").trim();
    const telefono = String(body.telefono ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const instagram = String(body.instagram ?? "").trim() || null;
    const direccion = String(body.direccion ?? "").trim() || null;
    const alergias = String(body.alergias ?? "").trim() || null;
    const enfermedades =
      String(body.enfermedades ?? "").trim() || null;
    const notas = String(body.notas ?? "").trim() || null;

    if (!nombre || !telefono) {
      return NextResponse.json(
        {
          error: "El nombre y el teléfono son obligatorios.",
        },
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
        { error: "Cliente no encontrado." },
        { status: 404 }
      );
    }

    const telefonoDuplicado = await prisma.cliente.findFirst({
      where: {
        estudioId: session.user.estudioId,
        telefono,
        NOT: {
          id: clienteId,
        },
      },
    });

    if (telefonoDuplicado) {
      return NextResponse.json(
        {
          error: "Ya existe otro cliente con ese teléfono.",
        },
        { status: 409 }
      );
    }

    const clienteActualizado = await prisma.cliente.update({
      where: {
        id: clienteId,
      },
      data: {
        nombre,
        telefono,
        email,
        instagram,
        direccion,
        alergias,
        enfermedades,
        notas,
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

    return NextResponse.json(clienteActualizado);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);

    return NextResponse.json(
      {
        error: "No se pudo actualizar el cliente.",
      },
      { status: 500 }
    );
  }
}
