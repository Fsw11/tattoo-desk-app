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

  const pagos = await prisma.pago.findMany({
    where: {
      estudioId: session.user.estudioId,
    },
    orderBy: {
      fecha: "desc",
    },
    select: {
      id: true,
      monto: true,
      fecha: true,
      metodo: true,
      concepto: true,
      notas: true,

      cliente: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      },

      tatuaje: {
        select: {
          id: true,
          nombre: true,
          precio: true,
          anticipo: true,
        },
      },

      usuario: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  return NextResponse.json(pagos);
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

    const monto = Number(body.monto);
    const clienteId = Number(body.clienteId);

    const metodosPermitidos = [
      "EFECTIVO",
      "TARJETA",
      "TRANSFERENCIA",
      "OTRO",
    ];

    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a cero." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(clienteId)) {
      return NextResponse.json(
        { error: "El cliente no es válido." },
        { status: 400 }
      );
    }

    if (!metodosPermitidos.includes(body.metodo)) {
      return NextResponse.json(
        { error: "El método de pago no es válido." },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        estudioId: session.user.estudioId,
      },
      select: {
        id: true,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        {
          error:
            "El cliente no pertenece a este estudio.",
        },
        { status: 404 }
      );
    }

    let tatuajeId: number | null = null;

    if (
      body.tatuajeId !== undefined &&
      body.tatuajeId !== null &&
      body.tatuajeId !== ""
    ) {
      tatuajeId = Number(body.tatuajeId);

      if (!Number.isInteger(tatuajeId)) {
        return NextResponse.json(
          { error: "El tatuaje no es válido." },
          { status: 400 }
        );
      }

      const tatuaje =
        await prisma.tatuaje.findFirst({
          where: {
            id: tatuajeId,
            clienteId: cliente.id,
            estudioId: session.user.estudioId,
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
          { status: 404 }
        );
      }
    }

    const pago = await prisma.pago.create({
      data: {
        monto,
        metodo: body.metodo,

        concepto:
          String(body.concepto ?? "").trim() || null,

        notas:
          String(body.notas ?? "").trim() || null,

        estudioId: session.user.estudioId,
        clienteId: cliente.id,
        tatuajeId,

        usuarioId: session.user.id
          ? Number(session.user.id)
          : null,
      },

      select: {
        id: true,
        monto: true,
        fecha: true,
        metodo: true,
        concepto: true,
        notas: true,

        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },

        tatuaje: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            anticipo: true,
          },
        },

        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(pago, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "No se pudo registrar el pago.",
      },
      {
        status: 500,
      }
    );
  }
}
