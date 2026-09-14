import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { limitesDePlan, featuresDePlan, FEATURE_LABELS } from "@/lib/planes";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const configuracion = await prisma.configuracionEstudio.findUnique({
    where: { estudioId: authResult.user.estudioId },
  });

  const suscripcion = await prisma.suscripcion.findUnique({
    where: { estudioId: authResult.user.estudioId },
  });

  const [clientes, fotos, usuarios] = await Promise.all([
    prisma.cliente.count({
      where: { estudioId: authResult.user.estudioId, eliminadoEn: null },
    }),
    prisma.foto.count({
      where: { estudioId: authResult.user.estudioId, eliminadoEn: null },
    }),
    prisma.usuario.count({
      where: {
        estudioId: authResult.user.estudioId,
        activo: true,
        eliminadoEn: null,
      },
    }),
  ]);

  const limites = limitesDePlan(suscripcion?.plan);
  const features = featuresDePlan(suscripcion?.plan);

  return NextResponse.json({
    ...(configuracion || {
      logoUrl: null,
      nombreMostrar: null,
      telefono: null,
      whatsapp: null,
      instagram: null,
      tema: "system",
      colorPrincipal: "#D4AF37",
      radio: "medio",
      plantillaConsentimiento: null,
      plantillaRecordatorio: null,
      exigirConsentimiento: true,
      horasAntesRecordatorio: 24,
    }),
    plan: {
      codigo: suscripcion?.plan || "FREE",
      estado: suscripcion?.estado || "PRUEBA",
      iniciaEn: suscripcion?.iniciaEn || null,
      venceEn: suscripcion?.venceEn || null,
      pruebaHasta: suscripcion?.pruebaHasta || null,
      limites,
      features,
      featureLabels: FEATURE_LABELS,
      uso: { clientes, fotos, usuarios },
    },
  });
}

export async function PATCH(request: Request) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();

    const data = {
      logoUrl: body.logoUrl ?? null,
      nombreMostrar: body.nombreMostrar ?? null,
      telefono: body.telefono ?? null,
      whatsapp: body.whatsapp ?? null,
      instagram: body.instagram ?? null,
      tema: body.tema ?? "system",
      colorPrincipal: body.colorPrincipal ?? "#D4AF37",
      radio: body.radio ?? "medio",
      plantillaConsentimiento: body.plantillaConsentimiento ?? null,
      plantillaRecordatorio: body.plantillaRecordatorio ?? null,
      exigirConsentimiento:
        body.exigirConsentimiento !== undefined
          ? Boolean(body.exigirConsentimiento)
          : undefined,
      horasAntesRecordatorio:
        body.horasAntesRecordatorio !== undefined
          ? Number(body.horasAntesRecordatorio)
          : undefined,
    };

    const configuracion = await prisma.configuracionEstudio.upsert({
      where: { estudioId: authResult.user.estudioId },
      create: {
        estudioId: authResult.user.estudioId,
        ...data,
        exigirConsentimiento: data.exigirConsentimiento ?? true,
        horasAntesRecordatorio: data.horasAntesRecordatorio ?? 24,
      },
      update: data,
    });

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo guardar la configuración." },
      { status: 500 },
    );
  }
}
