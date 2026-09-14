import { prisma } from "@/lib/prisma";
import {
  featuresDePlan,
  type FeatureKey,
  limitesDePlan,
} from "@/lib/planes";

export async function obtenerSuscripcion(estudioId: number) {
  return prisma.suscripcion.findUnique({ where: { estudioId } });
}

export async function assertFeature(
  estudioId: number,
  feature: FeatureKey,
): Promise<string | null> {
  const suscripcion = await obtenerSuscripcion(estudioId);
  const features = featuresDePlan(suscripcion?.plan);
  if (!features[feature]) {
    return `Esta herramienta no está incluida en tu plan. Actualiza a PRO o BUSINESS.`;
  }
  return null;
}

export async function assertDentroDeLimite(
  estudioId: number,
  recurso: "clientes" | "fotos" | "usuarios",
): Promise<string | null> {
  // Ya no limitamos clientes ni fotos por cupo; solo usuarios (FREE = 1).
  if (recurso === "clientes" || recurso === "fotos") {
    return null;
  }

  const suscripcion = await obtenerSuscripcion(estudioId);
  const features = featuresDePlan(suscripcion?.plan);
  const limites = limitesDePlan(suscripcion?.plan);

  if (recurso === "usuarios") {
    if (!features.multiUsuario && features.maxUsuarios <= 1) {
      const total = await prisma.usuario.count({
        where: { estudioId, activo: true, eliminadoEn: null },
      });
      if (total >= 1) {
        return "El plan FREE permite un solo usuario. Actualiza a PRO para agregar tatuadores.";
      }
    }
    const total = await prisma.usuario.count({
      where: { estudioId, activo: true, eliminadoEn: null },
    });
    if (total >= limites.usuarios) {
      return `Tu plan permite hasta ${limites.usuarios} usuarios. Actualiza tu plan.`;
    }
  }

  return null;
}
