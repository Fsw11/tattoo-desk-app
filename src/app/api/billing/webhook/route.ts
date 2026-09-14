import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Webhook Mercado Pago — actualiza Suscripcion al aprobar pago.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const topic = request.nextUrl.searchParams.get("topic") || body.type;
    const id =
      request.nextUrl.searchParams.get("id") ||
      body.data?.id ||
      body.id;

    if (topic !== "payment" && body.action !== "payment.created") {
      return NextResponse.json({ ok: true });
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token || !id) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const pagoRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!pagoRes.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }

    const pago = await pagoRes.json();
    if (pago.status !== "approved") {
      return NextResponse.json({ ok: true, status: pago.status });
    }

    const ref = String(pago.external_reference || "");
    const [estudioIdTexto, plan] = ref.split(":");
    const estudioId = Number(estudioIdTexto);

    if (!estudioId || !["PRO", "BUSINESS"].includes(plan)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const ahora = new Date();
    const venceEn = new Date(ahora);
    venceEn.setMonth(venceEn.getMonth() + 1);

    await prisma.suscripcion.upsert({
      where: { estudioId },
      create: {
        estudioId,
        plan: plan as "PRO" | "BUSINESS",
        estado: "ACTIVA",
        iniciaEn: ahora,
        venceEn,
        proveedorExternoId: String(pago.id),
      },
      update: {
        plan: plan as "PRO" | "BUSINESS",
        estado: "ACTIVA",
        iniciaEn: ahora,
        venceEn,
        proveedorExternoId: String(pago.id),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "webhook error" }, { status: 500 });
  }
}
