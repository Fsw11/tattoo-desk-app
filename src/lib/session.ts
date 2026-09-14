import { auth } from "@/auth";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  rol: "ADMIN" | "TATUADOR" | "RECEPCION";
  estudioId: number;
};

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

export async function requireSession(
  roles?: Array<"ADMIN" | "TATUADOR" | "RECEPCION">,
): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.estudioId || !session.user.id || !session.user.rol) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const user: SessionUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    rol: session.user.rol,
    estudioId: session.user.estudioId,
  };

  if (roles && !roles.includes(user.rol)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sin permiso" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}

export function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
