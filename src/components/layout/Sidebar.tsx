"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

type Configuracion = {
  logoUrl: string | null;
  nombreMostrar: string | null;
};

type Usuario = {
  name?: string | null;
  email?: string | null;
  rol?: "ADMIN" | "TATUADOR" | "RECEPCION";
};

const menu = [
  {
    nombre: "Dashboard",
    ruta: "/dashboard",
    icono: "🏠",
  },
  {
    nombre: "Clientes",
    ruta: "/clientes",
    icono: "👤",
  },
  {
    nombre: "Citas",
    ruta: "/citas",
    icono: "📅",
  },
  {
    nombre: "Tatuajes",
    ruta: "/tatuajes",
    icono: "🎨",
  },
  {
    nombre: "Galería",
    ruta: "/fotos",
    icono: "📷",
  },
  {
    nombre: "Inventario",
    ruta: "/inventario",
    icono: "📦",
  },
  {
    nombre: "Finanzas",
    ruta: "/finanzas",
    icono: "💰",
  },
  {
    nombre: "Configuración",
    ruta: "/configuracion",
    icono: "⚙️",
  },
];

export default function Sidebar({
  configuracion,
  usuario,
}: {
  configuracion: Configuracion | null;
  usuario: Usuario | null;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const nombre =
    configuracion?.nombreMostrar ||
    "Tattoo Desk";

  const contenidoMenu = (
    <>
      <div className="mb-8 flex items-center gap-3">
        {configuracion?.logoUrl && (
          <img
            src={configuracion.logoUrl}
            alt="Logo del estudio"
            className="h-12 w-12 rounded-xl object-cover"
          />
        )}

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">
            {nombre}
          </h1>

          <p className="text-sm text-muted-foreground">
            Gestión de estudio
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menu.map((item) => {
          const activo =
            pathname === item.ruta ||
            (item.ruta !== "/" &&
              pathname.startsWith(item.ruta));

          return (
            <Link
              key={item.ruta}
              href={item.ruta}
              onClick={() => setAbierto(false)}
              className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activo
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="text-base">
                {item.icono}
              </span>

              <span>
                {item.nombre}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t pt-4">
        <div className="mb-3 rounded-xl bg-muted/50 p-3">
          <p className="truncate text-sm font-semibold">
            {usuario?.name || "Usuario"}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {usuario?.email || ""}
          </p>

          {usuario?.rol && (
            <span className="mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium">
              {usuario.rol}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            signOut({
              callbackUrl: "/login",
            })
          }
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <span>↪</span>

          <span>
            Cerrar sesión
          </span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* BOTÓN MÓVIL */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border bg-background text-xl shadow-md lg:hidden"
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden min-h-screen w-64 flex-col border-r bg-background p-5 lg:flex">
        {contenidoMenu}
      </aside>

      {/* OVERLAY MÓVIL */}
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* SIDEBAR MÓVIL */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background p-5 shadow-2xl transition-transform duration-300 lg:hidden ${
          abierto
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Cerrar menú"
        >
          ✕
        </button>

        {contenidoMenu}
      </aside>
    </>
  );
}
