import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  request: Request
) {
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
    const formData =
      await request.formData();

    const archivo =
      formData.get("archivo");

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        {
          error:
            "No se recibió ningún archivo.",
        },
        {
          status: 400,
        }
      );
    }

    const bytes =
      await archivo.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    const extension =
      archivo.name.split(".").pop();

    const nombreArchivo =
      `${Date.now()}.${extension}`;

    const ruta =
      path.join(
        process.cwd(),
        "public",
        "uploads",
        nombreArchivo
      );

    await writeFile(
      ruta,
      buffer
    );

    return NextResponse.json({
      url:
        `/uploads/${nombreArchivo}`,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo subir la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}
