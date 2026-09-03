import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


// ========================================
// GET TATUAJES
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


  const tatuajes =
    await prisma.tatuaje.findMany({

      where: {
        estudioId:
          session.user.estudioId,
      },


      orderBy: {
        creadoEn: "desc",
      },


      select: {

        id: true,
        nombre: true,
        descripcion: true,
        estilo: true,
        zona: true,
        precio: true,
        anticipo: true,
        estado: true,
        notas: true,
        creadoEn: true,
        actualizadoEn: true,


        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },


        pagos: {
          orderBy: {
            fecha: "desc",
          },

          select: {
            id: true,
            monto: true,
            fecha: true,
            metodo: true,
            concepto: true,
          },
        },


        fotos: {
          orderBy: {
            creadoEn: "desc",
          },

          select: {
            id: true,
            url: true,
            descripcion: true,
            tipo: true,
            creadoEn: true,
          },
        },

      },

    });


  return NextResponse.json(tatuajes);
}




// ========================================
// POST CREAR TATUAJE
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

          id:
            clienteId,

          estudioId:
            session.user.estudioId,

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



    const tatuaje =
      await prisma.tatuaje.create({

        data: {

          nombre:
            String(body.nombre ?? "").trim(),

          descripcion:
            body.descripcion || null,

          estilo:
            body.estilo || null,

          zona:
            body.zona || null,

          precio:
            body.precio
              ? Number(body.precio)
              : null,

          anticipo:
            body.anticipo
              ? Number(body.anticipo)
              : null,

          estado:
            body.estado || "PENDIENTE",

          notas:
            body.notas || null,

          clienteId:
            clienteId,

          estudioId:
            session.user.estudioId,

          usuarioId:
            Number(session.user.id),

        },

        select: {
          id: true,
          nombre: true,
          descripcion: true,
          estilo: true,
          zona: true,
          precio: true,
          anticipo: true,
          estado: true,
          notas: true,
          creadoEn: true,
          actualizadoEn: true,

          cliente: {
            select: {
              id: true,
              nombre: true,
            },
          },

          pagos: true,
          fotos: true,
        },

      });



    return NextResponse.json(
      tatuaje,
      {
        status:201,
      }
    );


  } catch (error) {

    console.error(
      "Error creando tatuaje:",
      error
    );


    return NextResponse.json(
      {
        error:
          "No se pudo crear el tatuaje.",
      },
      {
        status:500,
      }
    );

  }

}
