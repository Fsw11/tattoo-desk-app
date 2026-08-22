import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


// ========================================
// GET FOTOS
// ========================================

export async function GET() {
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


  const fotos =
    await prisma.foto.findMany({

      where: {
        estudioId:
          session.user.estudioId,
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
}





// ========================================
// POST CREAR FOTO
// ========================================

export async function POST(
  request: NextRequest
) {

  const session = await auth();


  if (!session?.user) {
    return NextResponse.json(
      {
        error:"No autorizado",
      },
      {
        status:401,
      }
    );
  }


  try {

    const body =
      await request.json();


    const clienteId =
      Number(body.clienteId);


    if (!clienteId) {
      return NextResponse.json(
        {
          error:
            "Cliente requerido.",
        },
        {
          status:400,
        }
      );
    }



    const cliente =
      await prisma.cliente.findFirst({

        where: {
          id: clienteId,
          estudioId:
            session.user.estudioId,
        },

        select:{
          id:true,
        },

      });



    if (!cliente) {
      return NextResponse.json(
        {
          error:
            "Cliente no encontrado.",
        },
        {
          status:404,
        }
      );
    }



    const foto =
      await prisma.foto.create({

        data: {

          url:
            String(body.url ?? ""),

          descripcion:
            body.descripcion || null,

          tipo:
            body.tipo || "TATUAJE",


          estudioId:
            session.user.estudioId,


          clienteId:
            cliente.id,


          tatuajeId:
            body.tatuajeId
              ? Number(body.tatuajeId)
              : null,

        },

      });



    return NextResponse.json(
      foto,
      {
        status:201,
      }
    );


  } catch(error) {

    console.error(error);


    return NextResponse.json(
      {
        error:
          "No se pudo guardar la foto.",
      },
      {
        status:500,
      }
    );

  }

}
