import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  let horarios = await prisma.horarioEstudio.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
    orderBy: { diaSemana: "asc" },
  });

  if (horarios.length === 0) {
    await prisma.horarioEstudio.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
        estudioId: authResult.user.estudioId,
        diaSemana: dia,
        abierto: dia >= 1 && dia <= 6,
        horaInicio: "10:00",
        horaFin: "20:00",
      })),
    });
    horarios = await prisma.horarioEstudio.findMany({
      where: { estudioId: authResult.user.estudioId, eliminadoEn: null },
      orderBy: { diaSemana: "asc" },
    });
  }

  return NextResponse.json(horarios);
}

export async function PUT(request: Request) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const items = Array.isArray(body.horarios) ? body.horarios : [];

    await prisma.$transaction(
      items.map(
        (item: {
          diaSemana: number;
          abierto: boolean;
          horaInicio: string;
          horaFin: string;
        }) =>
          prisma.horarioEstudio.upsert({
            where: {
              estudioId_diaSemana: {
                estudioId: authResult.user.estudioId,
                diaSemana: Number(item.diaSemana),
              },
            },
            create: {
              estudioId: authResult.user.estudioId,
              diaSemana: Number(item.diaSemana),
              abierto: Boolean(item.abierto),
              horaInicio: String(item.horaInicio || "10:00"),
              horaFin: String(item.horaFin || "20:00"),
            },
            update: {
              abierto: Boolean(item.abierto),
              horaInicio: String(item.horaInicio || "10:00"),
              horaFin: String(item.horaFin || "20:00"),
              eliminadoEn: null,
            },
          }),
      ),
    );

    const horarios = await prisma.horarioEstudio.findMany({
      where: { estudioId: authResult.user.estudioId, eliminadoEn: null },
      orderBy: { diaSemana: "asc" },
    });

    return NextResponse.json(horarios);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudieron guardar los horarios." },
      { status: 500 },
    );
  }
}
