import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

/**
 * Recuperación de contraseña v1:
 * - Con RECOVERY_DEV_MODE=true devuelve un token temporal (solo desarrollo).
 * - En producción se enviaría por email (SMTP_*).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const token = String(body.token ?? "").trim();
    const nuevaPassword = String(body.nuevaPassword ?? "");

    if (!email) {
      return NextResponse.json(
        { error: "Correo requerido." },
        { status: 400 },
      );
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      return NextResponse.json({
        ok: true,
        message:
          "Si el correo existe, recibirás instrucciones de recuperación.",
      });
    }

    if (!token && !nuevaPassword) {
      const recoveryToken = crypto.randomUUID();
      // En prod: guardar token hasheado + expiry. v1: devolver solo en dev.
      if (process.env.RECOVERY_DEV_MODE === "true") {
        return NextResponse.json({
          ok: true,
          message: "Modo desarrollo: usa este token para restablecer.",
          token: recoveryToken,
          hint: "POST de nuevo con email, token y nuevaPassword",
        });
      }

      return NextResponse.json({
        ok: true,
        message:
          "Si el correo existe, recibirás instrucciones de recuperación.",
      });
    }

    if (nuevaPassword.length < 8) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    // v1 sin store de tokens: en RECOVERY_DEV_MODE cualquier token no vacío vale
    if (process.env.RECOVERY_DEV_MODE !== "true" || !token) {
      return NextResponse.json(
        { error: "Token inválido o expirado." },
        { status: 400 },
      );
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: await bcrypt.hash(nuevaPassword, 10) },
    });

    return NextResponse.json({
      ok: true,
      message: "Contraseña actualizada.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo procesar la recuperación." },
      { status: 500 },
    );
  }
}
