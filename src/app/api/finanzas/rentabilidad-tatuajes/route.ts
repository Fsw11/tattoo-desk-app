import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Periodo =
  | "hoy"
  | "semana"
  | "mes"
  | "anio"
  | "todo"
  | "personalizado";

// ========================================
// RENTABILIDAD POR TATUAJE CON PERIODOS
// ========================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const estudioId = session.user.estudioId;

    const { searchParams } = new URL(request.url);

    const periodo =
      (searchParams.get("periodo") || "mes") as Periodo;

    const inicioParam =
      searchParams.get("inicio");

    const finParam =
      searchParams.get("fin");

    // ========================================
    // CALCULAR RANGO DE FECHAS
    // ========================================

    let inicio: Date | undefined;
    let fin: Date | undefined;

    const ahora = new Date();

    if (periodo === "hoy") {
      inicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      );

      fin = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() + 1
      );
    }

    if (periodo === "semana") {
      const dia = ahora.getDay();
      const diferencia = dia === 0 ? 6 : dia - 1;

      inicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() - diferencia
      );

      inicio.setHours(0, 0, 0, 0);

      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 7);
    }

    if (periodo === "mes") {
      inicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1
      );

      fin = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + 1,
        1
      );
    }

    if (periodo === "anio") {
      inicio = new Date(
        ahora.getFullYear(),
        0,
        1
      );

      fin = new Date(
        ahora.getFullYear() + 1,
        0,
        1
      );
    }

    if (
      periodo === "personalizado" &&
      inicioParam &&
      finParam
    ) {
      inicio = new Date(
        `${inicioParam}T00:00:00`
      );

      const finInclusivo = new Date(
        `${finParam}T00:00:00`
      );

      fin = new Date(finInclusivo);
      fin.setDate(fin.getDate() + 1);
    }

    // ========================================
    // FILTRO DE FECHA
    // ========================================

    const filtroFecha =
      inicio && fin
        ? {
            gte: inicio,
            lt: fin,
          }
        : undefined;

    // ========================================
    // OBTENER TATUAJES
    // ========================================

    const tatuajes =
      await prisma.tatuaje.findMany({
        where: {
          estudioId,
        },

        orderBy: {
          creadoEn: "desc",
        },

        select: {
          id: true,
          nombre: true,
          estilo: true,
          zona: true,
          precio: true,
          estado: true,
          creadoEn: true,

          cliente: {
            select: {
              id: true,
              nombre: true,
            },
          },

          pagos: {
            where: filtroFecha
              ? {
                  fecha: filtroFecha,
                }
              : undefined,

            select: {
              id: true,
              monto: true,
              fecha: true,
            },
          },

          movimientosInventario: {
            where: {
              tipo: "SALIDA",

              ...(filtroFecha
                ? {
                    fecha: filtroFecha,
                  }
                : {}),
            },

            select: {
              id: true,
              cantidad: true,
              costoUnitario: true,
              costoTotal: true,
              fecha: true,

              inventario: {
                select: {
                  id: true,
                  nombre: true,
                  unidad: true,
                },
              },
            },
          },
        },
      });

    // ========================================
    // CALCULAR RENTABILIDAD
    // ========================================

    const resultado =
      tatuajes
        .map((tatuaje) => {

          const ingresos =
            tatuaje.pagos.reduce(
              (total, pago) =>
                total + Number(pago.monto),
              0
            );

          const costoMateriales =
            tatuaje.movimientosInventario.reduce(
              (total, movimiento) =>
                total +
                Number(
                  movimiento.costoTotal ?? 0
                ),
              0
            );

          const utilidad =
            ingresos - costoMateriales;

          const margen =
            ingresos > 0
              ? (utilidad / ingresos) * 100
              : 0;

          return {
            id: tatuaje.id,
            nombre: tatuaje.nombre,
            estilo: tatuaje.estilo,
            zona: tatuaje.zona,
            estado: tatuaje.estado,
            precio: Number(tatuaje.precio ?? 0),
            creadoEn: tatuaje.creadoEn,
            cliente: tatuaje.cliente,

            ingresos,
            costoMateriales,
            utilidad,
            margen,

            pagos: tatuaje.pagos.length,

            movimientosMaterial:
              tatuaje.movimientosInventario.length,

            materiales:
              tatuaje.movimientosInventario.map(
                (movimiento) => ({
                  id: movimiento.id,
                  nombre:
                    movimiento.inventario.nombre,
                  cantidad:
                    Number(movimiento.cantidad),
                  unidad:
                    movimiento.inventario.unidad,
                  costoUnitario:
                    Number(
                      movimiento.costoUnitario ?? 0
                    ),
                  costoTotal:
                    Number(
                      movimiento.costoTotal ?? 0
                    ),
                  fecha: movimiento.fecha,
                })
              ),
          };
        })

        // Solo tatuajes con actividad financiera
        .filter(
          (tatuaje) =>
            tatuaje.ingresos > 0 ||
            tatuaje.costoMateriales > 0
        );

    // ========================================
    // ORDENAR POR UTILIDAD
    // ========================================

    resultado.sort(
      (a, b) =>
        b.utilidad - a.utilidad
    );

    // ========================================
    // RESUMEN
    // ========================================

    const resumen = {
      tatuajes: resultado.length,

      ingresos:
        resultado.reduce(
          (total, tatuaje) =>
            total + tatuaje.ingresos,
          0
        ),

      costoMateriales:
        resultado.reduce(
          (total, tatuaje) =>
            total + tatuaje.costoMateriales,
          0
        ),

      utilidad:
        resultado.reduce(
          (total, tatuaje) =>
            total + tatuaje.utilidad,
          0
        ),
    };

    return NextResponse.json({
      periodo: {
        tipo: periodo,
        inicio: inicio ?? null,
        fin: fin ?? null,
      },

      resumen,

      tatuajes: resultado,
    });

  } catch (error) {

    console.error(
      "Error calculando rentabilidad por tatuaje:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo calcular la rentabilidad por tatuaje.",
      },
      {
        status: 500,
      }
    );
  }
}
