import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { assertDentroDeLimite, assertFeature } from "@/lib/limites";

export async function GET() {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  const usuarios = await prisma.usuario.findMany({
    where: {
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
    orderBy: { creadoEn: "asc" },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      creadoEn: true,
    },
  });

  return NextResponse.json(usuarios);
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  try {
    const limite = await assertDentroDeLimite(
      authResult.user.estudioId,
      "usuarios",
    );
    if (limite) {
      return NextResponse.json({ error: limite }, { status: 402 });
    }

    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rol = String(body.rol ?? "TATUADOR");

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, correo y contraseña son obligatorios." },
        { status: 400 },
      );
    }

    if (!["ADMIN", "TATUADOR", "RECEPCION"].includes(rol)) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
    }

    if (rol === "RECEPCION") {
      const feat = await assertFeature(
        authResult.user.estudioId,
        "recepcion",
      );
      if (feat) {
        return NextResponse.json({ error: feat }, { status: 402 });
      }
    } else if (rol === "TATUADOR" || rol === "ADMIN") {
      const feat = await assertFeature(
        authResult.user.estudioId,
        "multiUsuario",
      );
      if (feat) {
        return NextResponse.json({ error: feat }, { status: 402 });
      }
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json(
        { error: "Ese correo ya está registrado." },
        { status: 409 },
      );
    }

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: await bcrypt.hash(password, 10),
        rol: rol as "ADMIN" | "TATUADOR" | "RECEPCION",
        estudioId: authResult.user.estudioId,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo crear el usuario." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }

    const existe = await prisma.usuario.findFirst({
      where: {
        id,
        estudioId: authResult.user.estudioId,
        eliminadoEn: null,
      },
    });

    if (!existe) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 },
      );
    }

    const data: {
      nombre?: string;
      rol?: "ADMIN" | "TATUADOR" | "RECEPCION";
      activo?: boolean;
      password?: string;
    } = {};

    if (body.nombre) data.nombre = String(body.nombre).trim();
    if (body.rol && ["ADMIN", "TATUADOR", "RECEPCION"].includes(body.rol)) {
      data.rol = body.rol;
    }
    if (body.activo !== undefined) data.activo = Boolean(body.activo);
    if (body.password) {
      data.password = await bcrypt.hash(String(body.password), 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar el usuario." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "ID requerido." }, { status: 400 });
  }

  if (String(id) === authResult.user.id) {
    return NextResponse.json(
      { error: "No puedes desactivarte a ti mismo." },
      { status: 400 },
    );
  }

  const existe = await prisma.usuario.findFirst({
    where: {
      id,
      estudioId: authResult.user.estudioId,
      eliminadoEn: null,
    },
  });

  if (!existe) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 },
    );
  }

  await prisma.usuario.update({
    where: { id },
    data: { activo: false, eliminadoEn: new Date() },
  });

  return NextResponse.json({ ok: true });
}
