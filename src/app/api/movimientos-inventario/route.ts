import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ========================================
// GET MOVIMIENTOS
// ========================================

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
          tatuaje: {
            select: {
              id: true,
              nombre: true,
              cliente: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
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
        error: "Error al obtener movimientos",
      },
      {
        status: 500,
      }
    );
  }
}


// ========================================
// POST MOVIMIENTO
// ========================================

export async function POST(
  request: NextRequest
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const estudioId = session.user.estudioId;
    const body = await request.json();

    const inventarioId = Number(body.inventarioId);
    const tipo = String(body.tipo ?? "").trim();
    const cantidadMovimiento = Number(body.cantidad);
    const motivo =
      String(body.motivo ?? "").trim() || null;

    let tatuajeId: number | null = null;

    // ----------------------------------------
    // VALIDACIONES
    // ----------------------------------------

    if (!Number.isInteger(inventarioId)) {
      return NextResponse.json(
        {
          error: "El material no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      tipo !== "ENTRADA" &&
      tipo !== "SALIDA"
    ) {
      return NextResponse.json(
        {
          error:
            "El tipo de movimiento no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(cantidadMovimiento) ||
      cantidadMovimiento <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La cantidad debe ser mayor a cero.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // REGLA DE NEGOCIO
    // Solo las salidas pueden asociarse a un tatuaje
    // ----------------------------------------

    if (
      tipo === "ENTRADA" &&
      body.tatuajeId !== undefined &&
      body.tatuajeId !== null &&
      body.tatuajeId !== ""
    ) {
      return NextResponse.json(
        {
          error:
            "Solo las salidas de inventario pueden asociarse a un tatuaje.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // VALIDAR MATERIAL
    // ----------------------------------------

    const inventario =
      await prisma.inventario.findFirst({
        where: {
          id: inventarioId,
          estudioId,
          activo: true,
        },
      });

    if (!inventario) {
      return NextResponse.json(
        {
          error:
            "Material no encontrado o inactivo.",
        },
        {
          status: 404,
        }
      );
    }

    // ----------------------------------------
    // VALIDAR TATUAJE OPCIONAL
    // ----------------------------------------

    if (
      body.tatuajeId !== undefined &&
      body.tatuajeId !== null &&
      body.tatuajeId !== ""
    ) {
      tatuajeId = Number(body.tatuajeId);

      if (!Number.isInteger(tatuajeId)) {
        return NextResponse.json(
          {
            error:
              "El tatuaje no es válido.",
          },
          {
            status: 400,
          }
        );
      }

      const tatuaje =
        await prisma.tatuaje.findFirst({
          where: {
            id: tatuajeId,
            estudioId,
          },
          select: {
            id: true,
          },
        });

      if (!tatuaje) {
        return NextResponse.json(
          {
            error:
              "El tatuaje no pertenece a este estudio.",
          },
          {
            status: 404,
          }
        );
      }
    }

    // ----------------------------------------
    // CALCULAR NUEVO STOCK
    // ----------------------------------------

    const cantidadActual =
      Number(inventario.cantidad);

    let nuevaCantidad = cantidadActual;

    if (tipo === "ENTRADA") {
      nuevaCantidad += cantidadMovimiento;
    }

    if (tipo === "SALIDA") {
      nuevaCantidad -= cantidadMovimiento;

      if (nuevaCantidad < 0) {
        return NextResponse.json(
          {
            error: "Stock insuficiente.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ----------------------------------------
    // CALCULAR COSTOS
    // ----------------------------------------

    const costoUnitario =
      inventario.costo !== null
        ? Number(inventario.costo)
        : 0;

    const costoTotal =
      cantidadMovimiento * costoUnitario;

    // ----------------------------------------
    // TRANSACCION
    // ----------------------------------------

    const movimiento =
      await prisma.$transaction(
        async (tx) => {
          await tx.inventario.update({
            where: {
              id: inventario.id,
            },
            data: {
              cantidad: nuevaCantidad,
            },
          });

          return tx.movimientoInventario.create({
            data: {
              tipo,
              cantidad: cantidadMovimiento,
              motivo,

              costoUnitario,
              costoTotal,

              estudioId,
              inventarioId: inventario.id,
              tatuajeId,

              usuarioId:
                session.user.id
                  ? Number(session.user.id)
                  : null,
            },

            include: {
              inventario: true,

              usuario: {
                select: {
                  id: true,
                  nombre: true,
                },
              },

              tatuaje: {
                select: {
                  id: true,
                  nombre: true,
                  cliente: {
                    select: {
                      id: true,
                      nombre: true,
                    },
                  },
                },
              },
            },
          });
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
          "Error al crear movimiento de inventario.",
      },
      {
        status: 500,
      }
    );
  }
}
