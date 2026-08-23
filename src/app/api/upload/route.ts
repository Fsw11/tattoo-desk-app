import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const TIPOS_IMAGEN_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const TAMANO_MAXIMO = 10 * 1024 * 1024;

export async function POST(request: Request) {
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

  try {
    const formData = await request.formData();
    const archivo = formData.get("archivo");

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        {
          error: "No se recibió ningún archivo.",
        },
        {
          status: 400,
        }
      );
    }

    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
      return NextResponse.json(
        {
          error:
            "El archivo debe ser una imagen JPG, PNG, WEBP o GIF.",
        },
        {
          status: 400,
        }
      );
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json(
        {
          error:
            "La imagen no puede superar los 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const extensionPorTipo: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

    const extension = extensionPorTipo[archivo.type];

    const nombreArchivo =
      `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const carpetaUploads = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(carpetaUploads, {
      recursive: true,
    });

    const ruta = path.join(
      carpetaUploads,
      nombreArchivo
    );

    const bytes = await archivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(ruta, buffer);

    return NextResponse.json({
      url: `/uploads/${nombreArchivo}`,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "No se pudo subir la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}
