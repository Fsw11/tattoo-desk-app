"use client";

import { signOut } from "next-auth/react";

type Configuracion = {
  logoUrl: string | null;
  nombreMostrar: string | null;
};

type Usuario = {
  name?: string | null;
  email?: string | null;
  rol?: string;
} | null;

export default function Header({
  configuracion,
  usuario,
}: {
  configuracion: Configuracion | null;
  usuario: Usuario;
}) {

  const nombre =
    configuracion?.nombreMostrar ||
    "Tattoo Desk";

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:static lg:px-6">

      <div className="flex min-w-0 items-center gap-3 pl-12 lg:pl-0">

        {configuracion?.logoUrl && (
          <img
            src={configuracion.logoUrl}
            alt="Logo del estudio"
            className="hidden h-10 w-10 shrink-0 rounded-lg object-cover sm:block"
          />
        )}

        <div className="min-w-0">

          <h2 className="truncate font-semibold">
            {nombre}
          </h2>

          <p className="hidden text-xs text-muted-foreground sm:block">
            Panel de administración
          </p>

        </div>

      </div>


      <div className="flex shrink-0 items-center gap-2">

        <div className="hidden text-right md:block">

          <p className="text-sm font-medium">
            {usuario?.name || "Usuario"}
          </p>

          <p className="text-xs text-muted-foreground">
            {usuario?.rol || ""}
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            signOut({
              callbackUrl: "/login",
            })
          }
          className="flex min-h-[44px] items-center justify-center rounded-lg border px-3 py-2 text-sm transition hover:bg-muted"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <span className="hidden sm:inline">
            Cerrar sesión
          </span>

          <span className="text-lg sm:hidden">
            🚪
          </span>
        </button>

      </div>

    </header>
  );
}
