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

  const fotos = await prisma.foto.findMany({
    where: {
      estudioId: session.user.estudioId,
    },
    orderBy: {
      creadoEn: "desc",
    },
    select: {
      id: true,
      url: true,
      descripcion: true,
      tipo: true,
      creadoEn: true,

      cliente: {
        select: {
          id: true,
          nombre: true,
        },
      },

      tatuaje: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  return NextResponse.json(fotos);
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

    if (!Number.isInteger(clienteId)) {
      return NextResponse.json(
        {
          error: "El cliente es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    const tiposPermitidos = [
      "TATUAJE",
      "ANTES",
      "DESPUES",
      "DISENO",
      "OTRA",
    ];

    if (
      !tiposPermitidos.includes(
        body.tipo
      )
    ) {
      return NextResponse.json(
        {
          error: "Tipo de foto inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const cliente =
      await prisma.cliente.findFirst({
        where: {
          id: clienteId,
          estudioId:
            session.user.estudioId,
        },
        select: {
          id: true,
        },
      });

    if (!cliente) {
      return NextResponse.json(
        {
          error:
            "El cliente no pertenece al estudio.",
        },
        {
          status: 404,
        }
      );
    }

    let tatuajeId: number | null = null;

    if (
      body.tatuajeId !== undefined &&
      body.tatuajeId !== null &&
      body.tatuajeId !== ""
    ) {
      tatuajeId = Number(body.tatuajeId);

      const tatuaje =
        await prisma.tatuaje.findFirst({
          where: {
            id: tatuajeId,
            clienteId,
            estudioId:
              session.user.estudioId,
          },
          select: {
            id: true,
          },
        });

      if (!tatuaje) {
        return NextResponse.json(
          {
            error:
              "El tatuaje no pertenece al cliente.",
          },
          {
            status: 404,
          }
        );
      }
    }

    const foto =
      await prisma.foto.create({
        data: {
          url: String(body.url),

          descripcion:
            String(
              body.descripcion ?? ""
            ).trim() || null,

          tipo: body.tipo,

          estudioId:
            session.user.estudioId,

          clienteId,

          tatuajeId,
        },

        select: {
          id: true,
          url: true,
          descripcion: true,
          tipo: true,
          creadoEn: true,
        },
      });

    return NextResponse.json(
      foto,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo registrar la foto.",
      },
      {
        status: 500,
      }
    );
  }
}
