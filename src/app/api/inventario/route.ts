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

  const inventario =
    await prisma.inventario.findMany({
      where: {
        estudioId: session.user.estudioId,
      },
      orderBy: {
        creadoEn: "desc",
      },
    });

  return NextResponse.json(inventario);
}


export async function POST(
  request: Request
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body =
      await request.json();

    const nombre =
      String(
        body.nombre ?? ""
      ).trim();

    if (!nombre) {
      return NextResponse.json(
        {
          error:
            "El nombre es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    const inventario =
      await prisma.inventario.create({
        data: {
          nombre,

          descripcion:
            String(
              body.descripcion ?? ""
            ).trim() || null,

          categoria:
            String(
              body.categoria ?? ""
            ).trim() || null,

          cantidad:
            Number(
              body.cantidad ?? 0
            ),

          unidad:
            String(
              body.unidad ?? ""
            ).trim() || null,

          minimo:
            body.minimo
              ? Number(body.minimo)
              : null,

          costo:
            body.costo
              ? Number(body.costo)
              : null,

          estudioId:
            session.user.estudioId,
        },
      });

    return NextResponse.json(
      inventario,
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo crear el material.",
      },
      {
        status: 500,
      }
    );
  }
}
