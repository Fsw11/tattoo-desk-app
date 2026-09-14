import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  PLANTILLA_CONSENTIMIENTO_DEFAULT,
  PLANTILLA_RECORDATORIO_DEFAULT,
} from "@/lib/plantillas";

const DIAS = [0, 1, 2, 3, 4, 5, 6];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nombreEstudio = String(body.nombreEstudio ?? "").trim();
    const nombreAdmin = String(body.nombreAdmin ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!nombreEstudio || !nombreAdmin || !email || !password) {
      return NextResponse.json(
        { error: "Completa todos los campos." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const ahora = new Date();
    const pruebaHasta = new Date(ahora);
    pruebaHasta.setDate(pruebaHasta.getDate() + 14);

    const resultado = await prisma.$transaction(async (tx) => {
      const estudio = await tx.estudio.create({
        data: {
          nombre: nombreEstudio,
          email,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          nombre: nombreAdmin,
          email,
          password: passwordHash,
          rol: "ADMIN",
          estudioId: estudio.id,
        },
      });

      await tx.configuracionEstudio.create({
        data: {
          estudioId: estudio.id,
          nombreMostrar: nombreEstudio,
          tema: "system",
          colorPrincipal: "#D4AF37",
          radio: "medio",
          plantillaConsentimiento: PLANTILLA_CONSENTIMIENTO_DEFAULT,
          plantillaRecordatorio: PLANTILLA_RECORDATORIO_DEFAULT,
          exigirConsentimiento: true,
        },
      });

      await tx.suscripcion.create({
        data: {
          estudioId: estudio.id,
          plan: "FREE",
          estado: "PRUEBA",
          iniciaEn: ahora,
          pruebaHasta,
          venceEn: pruebaHasta,
        },
      });

      await tx.horarioEstudio.createMany({
        data: DIAS.map((dia) => ({
          estudioId: estudio.id,
          diaSemana: dia,
          abierto: dia >= 1 && dia <= 6,
          horaInicio: "10:00",
          horaFin: "20:00",
        })),
      });

      return { estudio, usuario };
    });

    return NextResponse.json(
      {
        ok: true,
        estudioId: resultado.estudio.id,
        email: resultado.usuario.email,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "No se pudo crear el estudio." },
      { status: 500 },
    );
  }
}
