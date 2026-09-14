import { NextResponse } from "next/server";

import { requireSession } from "@/lib/session";
import { obtenerSuscripcion } from "@/lib/limites";
import {
  FEATURE_LABELS,
  FEATURES_PLAN,
  featuresDePlan,
  type PlanCodigo,
} from "@/lib/planes";

export async function GET() {
  const authResult = await requireSession();
  if (!authResult.ok) return authResult.response;

  const suscripcion = await obtenerSuscripcion(authResult.user.estudioId);
  const plan = (suscripcion?.plan || "FREE") as PlanCodigo;
  const features = featuresDePlan(plan);

  return NextResponse.json({
    plan,
    features,
    labels: FEATURE_LABELS,
    planes: FEATURES_PLAN,
  });
}
