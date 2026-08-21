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

  const gastos = await prisma.gasto.findMany({
    where: {
      estudioId: session.user.estudioId,
    },
    orderBy: {
      fecha: "desc",
    },
    select: {
      id: true,
      concepto: true,
      descripcion: true,
      monto: true,
      fecha: true,
      categoria: true,
      notas: true,

      usuario: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  return NextResponse.json(gastos);
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

    const concepto = String(
      body.concepto ?? ""
    ).trim();

    const monto = Number(body.monto);

    const categoriasPermitidas = [
      "MATERIAL",
      "EQUIPO",
      "RENTA",
      "SERVICIOS",
      "MARKETING",
      "OTRO",
    ];

    if (!concepto) {
      return NextResponse.json(
        {
          error:
            "El concepto es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json(
        {
          error:
            "El monto debe ser mayor a cero.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !categoriasPermitidas.includes(
        body.categoria
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La categoría no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const gasto = await prisma.gasto.create({
      data: {
        concepto,

        descripcion:
          String(body.descripcion ?? "")
            .trim() || null,

        monto,

        categoria:
          body.categoria,

        notas:
          String(body.notas ?? "")
            .trim() || null,

        estudioId:
          session.user.estudioId,

        usuarioId:
          session.user.id
            ? Number(session.user.id)
            : null,
      },

      select: {
        id: true,
        concepto: true,
        descripcion: true,
        monto: true,
        fecha: true,
        categoria: true,
        notas: true,

        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(gasto, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo registrar el gasto.",
      },
      {
        status: 500,
      }
    );
  }
}
