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
      creadoEn: "desc",
    },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      email: true,
      instagram: true,
      creadoEn: true,
    },
  });

  return NextResponse.json(clientes);
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
    const telefono = String(body.telefono ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const instagram = String(body.instagram ?? "").trim() || null;

    if (!nombre || !telefono) {
      return NextResponse.json(
        {
          error: "El nombre y el teléfono son obligatorios.",
        },
        { status: 400 }
      );
    }

    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        estudioId: session.user.estudioId,
        telefono,
      },
    });

    if (clienteExistente) {
      return NextResponse.json(
        {
          error: "Ya existe un cliente con ese teléfono.",
        },
        { status: 409 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono,
        email,
        instagram,
        estudioId: session.user.estudioId,
      },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        email: true,
        instagram: true,
        creadoEn: true,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Error al crear cliente:", error);

    return NextResponse.json(
      {
        error: "No se pudo crear el cliente.",
      },
      { status: 500 }
    );
  }
}
