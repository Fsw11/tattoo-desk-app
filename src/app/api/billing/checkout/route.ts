import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/**
 * Checkout con Mercado Pago Preference (MX).
 * Si no hay MP_ACCESS_TOKEN, devuelve URL de simulación /configuracion?upgrade=1
 */
export async function POST(request: Request) {
  const authResult = await requireSession(["ADMIN"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const plan = String(body.plan ?? "PRO");
    if (!["PRO", "BUSINESS"].includes(plan)) {
      return NextResponse.json(
        { error: "Solo PRO o BUSINESS se pueden comprar." },
        { status: 400 },
      );
    }

    const precios: Record<string, number> = {
      PRO: 499,
      BUSINESS: 999,
    };

    const token = process.env.MP_ACCESS_TOKEN;
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    if (!token) {
      return NextResponse.json({
        mode: "manual",
        checkoutUrl: `${appUrl}/configuracion?upgrade=${plan}`,
        message:
          "Configura MP_ACCESS_TOKEN para cobro real. Mientras, activa el plan manualmente con ALLOW_MANUAL_PLAN.",
      });
    }

    const preference = {
      items: [
        {
          title: `Tattoo Desk ${plan}`,
          quantity: 1,
          currency_id: "MXN",
          unit_price: precios[plan],
        },
      ],
      external_reference: `${authResult.user.estudioId}:${plan}`,
      back_urls: {
        success: `${appUrl}/configuracion?pago=ok`,
        failure: `${appUrl}/configuracion?pago=error`,
        pending: `${appUrl}/configuracion?pago=pending`,
      },
      notification_url: `${appUrl}/api/billing/webhook`,
      auto_return: "approved",
    };

    const respuesta = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      },
    );

    const datos = await respuesta.json();
    if (!respuesta.ok) {
      console.error(datos);
      return NextResponse.json(
        { error: "No se pudo crear el checkout." },
        { status: 502 },
      );
    }

    await prisma.suscripcion.update({
      where: { estudioId: authResult.user.estudioId },
      data: { proveedorExternoId: String(datos.id) },
    });

    return NextResponse.json({
      mode: "mercadopago",
      checkoutUrl: datos.init_point || datos.sandbox_init_point,
      preferenceId: datos.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al iniciar el cobro." },
      { status: 500 },
    );
  }
}
