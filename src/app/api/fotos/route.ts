import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


// ========================================
// GET FOTOS
// ========================================

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const clienteIdParam = searchParams.get("clienteId");
    const tatuajeIdParam = searchParams.get("tatuajeId");

    const clienteId = clienteIdParam
      ? Number(clienteIdParam)
      : null;

    const tatuajeId = tatuajeIdParam
      ? Number(tatuajeIdParam)
      : null;

    if (
      clienteIdParam &&
      !Number.isInteger(clienteId)
    ) {
      return NextResponse.json(
        { error: "El cliente no es válido." },
        { status: 400 }
      );
    }

    if (
      tatuajeIdParam &&
      !Number.isInteger(tatuajeId)
    ) {
      return NextResponse.json(
        { error: "El tatuaje no es válido." },
        { status: 400 }
      );
    }

    const fotos = await prisma.foto.findMany({
      where: {
        estudioId: session.user.estudioId,

        ...(clienteId !== null
          ? { clienteId }
          : {}),

        ...(tatuajeId !== null
          ? { tatuajeId }
          : {}),
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
        clienteId: true,
        tatuajeId: true,

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
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "No se pudieron cargar las fotos.",
      },
      {
        status: 500,
      }
    );
  }
}


// ========================================
// POST CREAR FOTO
// ========================================

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
        { error: "El cliente no es válido." },
        { status: 400 }
      );
    }

    const url = String(body.url ?? "").trim();

    if (!url) {
      return NextResponse.json(
        {
          error: "La URL de la imagen es obligatoria.",
        },
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

    const tiposPermitidos = [
      "TATUAJE",
      "DISENO",
      "PROCESO",
      "RESULTADO",
      "OTRA",
    ];

    const tipo = tiposPermitidos.includes(
      body.tipo
    )
      ? body.tipo
      : "TATUAJE";

    const foto = await prisma.foto.create({
      data: {
        url,

        descripcion:
          String(
            body.descripcion ?? ""
          ).trim() || null,

        tipo,

        estudioId:
          session.user.estudioId,

        clienteId:
          cliente.id,

        tatuajeId,
      },

      select: {
        id: true,
        url: true,
        descripcion: true,
        tipo: true,
        creadoEn: true,
        clienteId: true,
        tatuajeId: true,
      },
    });

    return NextResponse.json(foto, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "No se pudo guardar la foto.",
      },
      {
        status: 500,
      }
    );
  }
}


// ========================================
// DELETE ELIMINAR FOTO
// ========================================

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const fotoId = Number(body.id);

    if (!Number.isInteger(fotoId)) {
      return NextResponse.json(
        {
          error: "El ID de la foto no es válido.",
        },
        { status: 400 }
      );
    }

    const foto = await prisma.foto.findFirst({
      where: {
        id: fotoId,
        estudioId: session.user.estudioId,
      },
      select: {
        id: true,
        url: true,
      },
    });

    if (!foto) {
      return NextResponse.json(
        {
          error: "Foto no encontrada.",
        },
        { status: 404 }
      );
    }

    await prisma.foto.delete({
      where: {
        id: foto.id,
      },
    });

    if (foto.url.startsWith("/uploads/")) {
      try {
        const { unlink } = await import("fs/promises");
        const path = await import("path");

        const nombreArchivo = foto.url
          .replace("/uploads/", "")
          .replace(/^\/+/, "");

        const rutaArchivo = path.join(
          process.cwd(),
          "public",
          "uploads",
          nombreArchivo
        );

        await unlink(rutaArchivo);
      } catch (error) {
        console.error(
          "No se pudo eliminar el archivo físico:",
          error
        );
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Foto eliminada correctamente.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar la foto.",
      },
      {
        status: 500,
      }
    );
  }
}
