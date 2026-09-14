import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { LIMITES_PLAN } from "@/lib/planes";

/**
 * Activación manual de plan (admin del estudio o variable ADMIN_PLAN_KEY).
 * Pasarela real: POST /api/billing/checkout
 */
export async function PATCH(request: Request) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const plan = String(body.plan ?? "");
    const adminKey = request.headers.get("x-admin-plan-key");

    const permiteManual =
      process.env.ALLOW_MANUAL_PLAN === "true" ||
      process.env.NODE_ENV !== "production" ||
      (process.env.ADMIN_PLAN_KEY &&
        adminKey === process.env.ADMIN_PLAN_KEY);

    if (!permiteManual && plan !== "FREE") {
      return NextResponse.json(
        {
          error:
            "Activa ALLOW_MANUAL_PLAN=true o usa /api/billing/checkout para subir de plan.",
        },
        { status: 403 },
      );
    }

    if (!["FREE", "PRO", "BUSINESS"].includes(plan)) {
      return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
    }

    const ahora = new Date();
    const venceEn = new Date(ahora);
    venceEn.setMonth(venceEn.getMonth() + 1);

    const suscripcion = await prisma.suscripcion.upsert({
      where: { estudioId: authResult.user.estudioId },
      create: {
        estudioId: authResult.user.estudioId,
        plan: plan as "FREE" | "PRO" | "BUSINESS",
        estado: "ACTIVA",
        iniciaEn: ahora,
        venceEn,
      },
      update: {
        plan: plan as "FREE" | "PRO" | "BUSINESS",
        estado: "ACTIVA",
        iniciaEn: ahora,
        venceEn,
      },
    });

    return NextResponse.json({
      suscripcion,
      limites: LIMITES_PLAN[plan as keyof typeof LIMITES_PLAN],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar el plan." },
      { status: 500 },
    );
  }
}
