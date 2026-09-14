import { NextResponse } from "next/server";

import { requireSession } from "@/lib/session";
import { guardarImagen, validarImagen } from "@/lib/storage";

export async function POST(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  try {
    const formData = await request.formData();
    const archivo = formData.get("archivo");

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo." },
        { status: 400 },
      );
    }

    const errorValidacion = validarImagen(archivo);
    if (errorValidacion) {
      return NextResponse.json({ error: errorValidacion }, { status: 400 });
    }

    const resultado = await guardarImagen(
      archivo,
      `uploads/${authResult.user.estudioId}`,
    );

    return NextResponse.json(resultado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo subir la imagen." },
      { status: 500 },
    );
  }
}
