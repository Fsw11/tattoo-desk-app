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
