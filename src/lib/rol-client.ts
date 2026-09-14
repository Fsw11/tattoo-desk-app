"use client";

import { useSession } from "next-auth/react";

export type RolApp = "ADMIN" | "TATUADOR" | "RECEPCION";

export function useSessionUser() {
  const { data } = useSession();
  const user = data?.user as
    | {
        id?: string;
        name?: string | null;
        nombre?: string;
        rol?: RolApp;
        estudioId?: number;
      }
    | undefined;

  if (!user?.id) return null;

  return {
    id: String(user.id),
    nombre: user.nombre || user.name || "",
    rol: (user.rol || "TATUADOR") as RolApp,
    estudioId: user.estudioId,
  };
}

export function puedeAsignarTatuador(rol: RolApp | string | undefined) {
  return rol === "ADMIN" || rol === "RECEPCION";
}

export function usePuedeAsignarTatuador() {
  const user = useSessionUser();
  return puedeAsignarTatuador(user?.rol);
}
