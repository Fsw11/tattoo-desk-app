import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";


// GET movimientos
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const estudioId = session.user.estudioId;

    const movimientos =
      await prisma.movimientoInventario.findMany({
        where: {
          estudioId,
        },
        include: {
          inventario: true,
          usuario: true,
        },
        orderBy: {
          fecha: "desc",
        },
      });

    return NextResponse.json(movimientos);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          "Error al obtener movimientos",
      },
      {
        status: 500,
      }
    );
  }
}



// POST movimiento
export async function POST(
  request: NextRequest
) {
  try {

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


    const estudioId =
      session.user.estudioId;


    const body =
      await request.json();


    const {
      inventarioId,
      tipo,
      cantidad,
      motivo,
    } = body;


    if (
      !inventarioId ||
      !tipo ||
      !cantidad
    ) {
      return NextResponse.json(
        {
          error:
            "Datos incompletos",
        },
        {
          status: 400,
        }
      );
    }


    const inventario =
      await prisma.inventario.findFirst({
        where: {
          id: Number(inventarioId),
          estudioId,
        },
      });


    if (!inventario) {
      return NextResponse.json(
        {
          error:
            "Material no encontrado",
        },
        {
          status: 404,
        }
      );
    }


    const cantidadMovimiento =
      Number(cantidad);


    let nuevaCantidad =
      Number(inventario.cantidad);



    if (tipo === "ENTRADA") {

      nuevaCantidad += cantidadMovimiento;

    }


    if (tipo === "SALIDA") {

      nuevaCantidad -= cantidadMovimiento;

      if (nuevaCantidad < 0) {

        return NextResponse.json(
          {
            error:
              "Stock insuficiente",
          },
          {
            status: 400,
          }
        );

      }

    }



    const movimiento =
      await prisma.$transaction(
        async (tx) => {

          await tx.inventario.update({
            where: {
              id: inventario.id,
            },
            data: {
              cantidad:
                nuevaCantidad,
            },
          });


          return tx.movimientoInventario.create(
            {
              data: {
                tipo,
                cantidad:
                  cantidadMovimiento,
                motivo:
                  motivo || null,

                estudioId,

                inventarioId:
                  inventario.id,

                usuarioId:
                  session.user.id
                    ? Number(
                        session.user.id
                      )
                    : null,
              },
              include: {
                inventario: true,
              },
            }
          );

        }
      );


    return NextResponse.json(
      movimiento,
      {
        status: 201,
      }
    );


  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          "Error al crear movimiento",
      },
      {
        status: 500,
      }
    );

  }
}
