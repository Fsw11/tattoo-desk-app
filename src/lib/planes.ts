export type PlanCodigo = "FREE" | "PRO" | "BUSINESS";

export type FeatureKey =
  | "multiUsuario"
  | "recepcion"
  | "consentimiento"
  | "recordatorios"
  | "pos"
  | "inventario"
  | "finanzasAvanzadas"
  | "marcaCustom"
  | "offline"
  | "exportaciones"
  | "reservaPublica"
  | "anticiposOnline"
  | "comisiones"
  | "multiSede"
  | "marketingInactivos";

export type FeaturesPlan = Record<FeatureKey, boolean> & {
  maxUsuarios: number; // 1 = solo dueño FREE; Infinity práctico = 9999
};

export const FEATURES_PLAN: Record<PlanCodigo, FeaturesPlan> = {
  FREE: {
    multiUsuario: false,
    recepcion: false,
    consentimiento: false,
    recordatorios: false,
    pos: false,
    inventario: false,
    finanzasAvanzadas: false,
    marcaCustom: false,
    offline: false,
    exportaciones: false,
    reservaPublica: false,
    anticiposOnline: false,
    comisiones: false,
    multiSede: false,
    marketingInactivos: false,
    maxUsuarios: 1,
  },
  PRO: {
    multiUsuario: true,
    recepcion: false,
    consentimiento: true,
    recordatorios: true,
    pos: true,
    inventario: true,
    finanzasAvanzadas: true,
    marcaCustom: true,
    offline: true,
    exportaciones: false,
    reservaPublica: false,
    anticiposOnline: false,
    comisiones: false,
    multiSede: false,
    marketingInactivos: false,
    maxUsuarios: 50,
  },
  BUSINESS: {
    multiUsuario: true,
    recepcion: true,
    consentimiento: true,
    recordatorios: true,
    pos: true,
    inventario: true,
    finanzasAvanzadas: true,
    marcaCustom: true,
    offline: true,
    exportaciones: true,
    reservaPublica: true,
    anticiposOnline: true,
    comisiones: true,
    multiSede: true,
    marketingInactivos: true,
    maxUsuarios: 9999,
  },
};

/** Etiquetas para UI de comparación de planes */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  multiUsuario: "Equipo multi-tatuador",
  recepcion: "Rol recepción",
  consentimiento: "Consentimiento con firma",
  recordatorios: "Recordatorios WhatsApp",
  pos: "Punto de venta",
  inventario: "Inventario y materiales",
  finanzasAvanzadas: "Finanzas completas",
  marcaCustom: "Marca personalizable",
  offline: "Modo offline / PWA sync",
  exportaciones: "Export CSV/PDF",
  reservaPublica: "Reserva pública online",
  anticiposOnline: "Anticipos online",
  comisiones: "Comisiones por artista",
  multiSede: "Multi-sede",
  marketingInactivos: "Reactivación de clientes",
};

export function featuresDePlan(
  plan: string | null | undefined,
): FeaturesPlan {
  if (plan === "PRO" || plan === "BUSINESS" || plan === "FREE") {
    return FEATURES_PLAN[plan];
  }
  return FEATURES_PLAN.FREE;
}

/** @deprecated usar featuresDePlan — se mantiene por compatibilidad temporal */
export type LimitesPlan = {
  clientes: number;
  fotos: number;
  usuarios: number;
  storageMb: number;
};

export const LIMITES_PLAN: Record<PlanCodigo, LimitesPlan> = {
  FREE: { clientes: 999999, fotos: 999999, usuarios: 1, storageMb: 500 },
  PRO: { clientes: 999999, fotos: 999999, usuarios: 50, storageMb: 10000 },
  BUSINESS: {
    clientes: 999999,
    fotos: 999999,
    usuarios: 9999,
    storageMb: 100000,
  },
};

export function limitesDePlan(plan: string | null | undefined): LimitesPlan {
  if (plan === "PRO" || plan === "BUSINESS" || plan === "FREE") {
    return LIMITES_PLAN[plan];
  }
  return LIMITES_PLAN.FREE;
}
