"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

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
    ruta: "/",
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
    ruta: "/galeria",
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

  const nombre =
    configuracion?.nombreMostrar ||
    "Tattoo Desk";


  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r bg-background p-5 lg:flex">

      <div className="mb-8 flex items-center gap-3">

        {configuracion?.logoUrl && (
          <img
            src={configuracion.logoUrl}
            alt="Logo del estudio"
            className="h-12 w-12 rounded-xl object-cover"
          />
        )}

        <div>
          <h1 className="text-xl font-bold">
            {nombre}
          </h1>

          <p className="text-sm text-muted-foreground">
            Gestión de estudio
          </p>
        </div>

      </div>


      <nav className="flex-1 space-y-2">

        {menu.map((item) => (

          <Link
            key={item.ruta}
            href={item.ruta}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname === item.ruta ||
              (item.ruta !== "/" &&
                pathname.startsWith(item.ruta))
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

        ))}

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
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <span>
            ↪
          </span>

          <span>
            Cerrar sesión
          </span>
        </button>

      </div>

    </aside>
  );
}
