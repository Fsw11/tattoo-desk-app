import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ========================================
// GET CLIENTES
// ========================================

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
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
      direccion: true,
      alergias: true,
      enfermedades: true,
      notas: true,
      creadoEn: true,
      actualizadoEn: true,

      fotos: {
        orderBy: {
          creadoEn: "desc",
        },

        select: {
          id: true,
          url: true,
          descripcion: true,
          tipo: true,
          creadoEn: true,
        },
      },

      tatuajes: {
        orderBy: {
          creadoEn: "desc",
        },

        select: {
          id: true,
          nombre: true,
          estilo: true,
          zona: true,
          precio: true,
          anticipo: true,
          estado: true,

          pagos: {
            orderBy: {
              fecha: "desc",
            },

            select: {
              id: true,
              monto: true,
              fecha: true,
              metodo: true,
              concepto: true,
            },
          },

          fotos: {
            orderBy: {
              creadoEn: "desc",
            },

            select: {
              id: true,
              url: true,
              descripcion: true,
              tipo: true,
              creadoEn: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(clientes);
}

// ========================================
// POST CREAR CLIENTE
// ========================================

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body = await request.json();

    const nombre = String(body.nombre ?? "").trim();
    const telefono = String(body.telefono ?? "").trim();

    if (!nombre || !telefono) {
      return NextResponse.json(
        {
          error: "Nombre y teléfono son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono,

        email:
          body.email
            ? String(body.email).trim()
            : null,

        instagram:
          body.instagram
            ? String(body.instagram).trim()
            : null,

        direccion:
          body.direccion
            ? String(body.direccion).trim()
            : null,

        alergias:
          body.alergias
            ? String(body.alergias).trim()
            : null,

        enfermedades:
          body.enfermedades
            ? String(body.enfermedades).trim()
            : null,

        notas:
          body.notas
            ? String(body.notas).trim()
            : null,

        estudioId: session.user.estudioId,
      },
    });

    return NextResponse.json(cliente, {
      status: 201,
    });
  } catch (error) {
    console.error("Error creando cliente:", error);

    return NextResponse.json(
      {
        error: "No se pudo crear el cliente.",
      },
      {
        status: 500,
      }
    );
  }
}

// ========================================
// PATCH EDITAR CLIENTE
// ========================================

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body = await request.json();

    const clienteId = Number(body.id);

    if (!clienteId || Number.isNaN(clienteId)) {
      return NextResponse.json(
        {
          error: "ID requerido.",
        },
        {
          status: 400,
        }
      );
    }

    const existe = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        estudioId: session.user.estudioId,
      },
    });

    if (!existe) {
      return NextResponse.json(
        {
          error: "Cliente no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const nombre = String(body.nombre ?? "").trim();
    const telefono = String(body.telefono ?? "").trim();

    if (!nombre || !telefono) {
      return NextResponse.json(
        {
          error: "Nombre y teléfono son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    const cliente = await prisma.cliente.update({
      where: {
        id: clienteId,
      },

      data: {
        nombre,
        telefono,

        email:
          body.email
            ? String(body.email).trim()
            : null,

        instagram:
          body.instagram
            ? String(body.instagram).trim()
            : null,

        direccion:
          body.direccion
            ? String(body.direccion).trim()
            : null,

        alergias:
          body.alergias
            ? String(body.alergias).trim()
            : null,

        enfermedades:
          body.enfermedades
            ? String(body.enfermedades).trim()
            : null,

        notas:
          body.notas
            ? String(body.notas).trim()
            : null,
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

    return NextResponse.json(cliente, {
      status: 200,
    });
  } catch (error) {
    console.error("Error actualizando cliente:", error);

    return NextResponse.json(
      {
        error: "No se pudo actualizar el cliente.",
      },
      {
        status: 500,
      }
    );
  }
}
