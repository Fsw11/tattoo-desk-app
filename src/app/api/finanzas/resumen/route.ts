import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ========================================
// RESUMEN FINANCIERO INTEGRADO
// CON FILTROS POR PERIODO
// ========================================

export async function GET(request: NextRequest) {
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

    const estudioId = session.user.estudioId;

    // ========================================
    // FILTROS DE FECHA
    // ========================================

    const { searchParams } = new URL(request.url);

    const periodo =
      searchParams.get("periodo") || "todo";

    const inicioParam =
      searchParams.get("inicio");

    const finParam =
      searchParams.get("fin");

    let inicio: Date | null = null;
    let fin: Date | null = null;

    const ahora = new Date();

    if (periodo === "hoy") {
      inicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
        0,
        0,
        0,
        0
      );

      fin = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
        23,
        59,
        59,
        999
      );
    }

    if (periodo === "semana") {
      const diaSemana = ahora.getDay();

      const diferencia =
        diaSemana === 0 ? 6 : diaSemana - 1;

      inicio = new Date(ahora);
      inicio.setDate(
        ahora.getDate() - diferencia
      );
      inicio.setHours(0, 0, 0, 0);

      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
    }

    if (periodo === "mes") {
      inicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1,
        0,
        0,
        0,
        0
      );

      fin = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    }

    if (periodo === "anio") {
      inicio = new Date(
        ahora.getFullYear(),
        0,
        1,
        0,
        0,
        0,
        0
      );

      fin = new Date(
        ahora.getFullYear(),
        11,
        31,
        23,
        59,
        59,
        999
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

      fin = new Date(
        `${finParam}T23:59:59.999`
      );
    }

    const filtroFecha =
      inicio && fin
        ? {
            gte: inicio,
            lte: fin,
          }
        : undefined;


    // ========================================
    // INGRESOS
    // ========================================

    const pagos =
      await prisma.pago.findMany({
        where: {
          estudioId,
          eliminadoEn: null,
          ...(filtroFecha
            ? {
                fecha: filtroFecha,
              }
            : {}),
        },
        select: {
          monto: true,
          fecha: true,
        },
      });


    const totalIngresos =
      pagos.reduce(
        (total, pago) =>
          total + Number(pago.monto),
        0
      );


    // ========================================
    // GASTOS OPERATIVOS
    // ========================================

    const gastos =
      await prisma.gasto.findMany({
        where: {
          estudioId,
          ...(filtroFecha
            ? {
                fecha: filtroFecha,
              }
            : {}),
        },
        select: {
          monto: true,
          fecha: true,
          categoria: true,
        },
      });


    const totalGastosOperativos =
      gastos.reduce(
        (total, gasto) =>
          total + Number(gasto.monto),
        0
      );


    // ========================================
    // COSTO DE MATERIALES
    // ========================================

    const movimientos =
      await prisma.movimientoInventario.findMany({
        where: {
          estudioId,
          tipo: "SALIDA",
          ...(filtroFecha
            ? {
                fecha: filtroFecha,
              }
            : {}),
        },
        select: {
          costoTotal: true,
          tatuajeId: true,
          fecha: true,
          inventario: {
            select: {
              nombre: true,
            },
          },
        },
      });


    let costoMateriales = 0;
    let costoMaterialesTatuajes = 0;
    let costoMaterialesGenerales = 0;


    for (const movimiento of movimientos) {

      const costo =
        Number(
          movimiento.costoTotal ?? 0
        );

      costoMateriales += costo;

      if (movimiento.tatuajeId) {
        costoMaterialesTatuajes += costo;
      } else {
        costoMaterialesGenerales += costo;
      }

    }


    // ========================================
    // RESULTADOS FINANCIEROS
    // ========================================

    const utilidadBruta =
      totalIngresos -
      costoMaterialesTatuajes;


    const gastosTotales =
      totalGastosOperativos +
      costoMateriales;


    const utilidadNeta =
      totalIngresos -
      gastosTotales;


    const margenUtilidad =
      totalIngresos > 0
        ? (utilidadNeta / totalIngresos) * 100
        : 0;


    return NextResponse.json({

      periodo: {
        tipo: periodo,
        inicio,
        fin,
      },

      ingresos: {
        total: totalIngresos,
        registros: pagos.length,
      },

      gastosOperativos: {
        total: totalGastosOperativos,
        registros: gastos.length,
      },

      materiales: {
        total: costoMateriales,

        utilizadosEnTatuajes:
          costoMaterialesTatuajes,

        usoGeneral:
          costoMaterialesGenerales,

        movimientos:
          movimientos.length,
      },

      resultado: {
        utilidadBruta,
        gastosTotales,
        utilidadNeta,
        margenUtilidad,
      },

    });

  } catch (error) {

    console.error(
      "Error generando resumen financiero:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo generar el resumen financiero.",
      },
      {
        status: 500,
      }
    );
  }
}
