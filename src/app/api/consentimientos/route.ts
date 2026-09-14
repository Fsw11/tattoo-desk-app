import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { assertFeature } from "@/lib/limites";
import { PLANTILLA_CONSENTIMIENTO_DEFAULT } from "@/lib/plantillas";

export async function GET(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const clienteId = new URL(request.url).searchParams.get("clienteId");

  const consentimientos = await prisma.consentimiento.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
      ...(clienteId ? { clienteId } : {}),
    },
    orderBy: { firmadoEn: "desc" },
    include: {
      cliente: { select: { id: true, nombre: true } },
      cita: { select: { id: true, fecha: true } },
    },
  });

  return NextResponse.json(consentimientos);
}

export async function POST(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const feat = await assertFeature(
    authResult.user.estudioId,
    "consentimiento",
  );
  if (feat) {
    return NextResponse.json({ error: feat }, { status: 402 });
  }

  try {
    const body = await request.json();
    const clienteId = String(body.clienteId ?? "");
    const firmaUrl = String(body.firmaUrl ?? "").trim();

    if (!clienteId || !firmaUrl) {
      return NextResponse.json(
        { error: "Cliente y firma son obligatorios." },
        { status: 400 },
      );
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado." },
        { status: 404 },
      );
    }

    const config = await prisma.configuracionEstudio.findUnique({
      where: { estudioId: authResult.user.estudioId },
    });

    const consentimiento = await prisma.consentimiento.create({
      data: {
        id: body.id || crypto.randomUUID(),
        textoPlantilla:
          body.textoPlantilla ||
          config?.plantillaConsentimiento ||
          PLANTILLA_CONSENTIMIENTO_DEFAULT,
        firmaUrl,
        estudioId: authResult.user.estudioId,
        clienteId,
        citaId: body.citaId ? String(body.citaId) : null,
        firmadoEn: body.firmadoEn ? new Date(body.firmadoEn) : new Date(),
      },
    });

    return NextResponse.json(consentimiento, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo guardar el consentimiento." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido." }, { status: 400 });
  }

  const existe = await prisma.consentimiento.findFirst({
    where: {
      id,
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
  });

  if (!existe) {
    return NextResponse.json(
      { error: "Consentimiento no encontrado." },
      { status: 404 },
    );
  }

  await prisma.consentimiento.update({
    where: { id },
    data: { eliminadoEn: new Date() },
  });

  return NextResponse.json({ ok: true });
}
