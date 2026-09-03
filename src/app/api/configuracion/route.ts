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

  const configuracion =
    await prisma.configuracionEstudio.findUnique({
      where: {
        estudioId: session.user.estudioId,
      },
    });

  return NextResponse.json(
    configuracion ?? null
  );
}


export async function PATCH(
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
    const body = await request.json();

    const configuracion =
      await prisma.configuracionEstudio.upsert({
        where: {
          estudioId: session.user.estudioId,
        },

        update: {
          logoUrl: body.logoUrl ?? null,
          nombreMostrar:
            body.nombreMostrar ?? null,
          telefono:
            body.telefono ?? null,
          whatsapp:
            body.whatsapp ?? null,
          instagram:
            body.instagram ?? null,
          tema:
            body.tema ?? "dark",
          colorPrincipal:
            body.colorPrincipal ?? "#D4AF37",
        },

        create: {
          estudioId:
            session.user.estudioId,

          logoUrl:
            body.logoUrl ?? null,

          nombreMostrar:
            body.nombreMostrar ?? null,

          telefono:
            body.telefono ?? null,

          whatsapp:
            body.whatsapp ?? null,

          instagram:
            body.instagram ?? null,

          tema:
            body.tema ?? "dark",

          colorPrincipal:
            body.colorPrincipal ?? "#D4AF37",
        },
      });

    return NextResponse.json(
      configuracion
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo guardar la configuración.",
      },
      {
        status: 500,
      }
    );
  }
}
