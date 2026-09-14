"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Camera,
  ClipboardList,
  FilePenLine,
  Home,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { FeaturesPlan } from "@/lib/planes";

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
  { nombre: "Dashboard", ruta: "/dashboard", icono: Home },
  { nombre: "Clientes", ruta: "/clientes", icono: Users },
  { nombre: "Citas", ruta: "/citas", icono: CalendarDays },
  { nombre: "Tatuajes", ruta: "/tatuajes", icono: ClipboardList },
  { nombre: "Galería", ruta: "/fotos", icono: Camera },
  {
    nombre: "Consentimiento",
    ruta: "/consentimiento",
    icono: FilePenLine,
    feature: "consentimiento" as const,
  },
  {
    nombre: "Punto de venta",
    ruta: "/pos",
    icono: ShoppingCart,
    feature: "pos" as const,
  },
  {
    nombre: "Inventario",
    ruta: "/inventario",
    icono: Package,
    feature: "inventario" as const,
  },
  {
    nombre: "Finanzas",
    ruta: "/finanzas",
    icono: Wallet,
    feature: "finanzasAvanzadas" as const,
  },
  { nombre: "Configuración", ruta: "/configuracion", icono: Settings },
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
  const [features, setFeatures] = useState<FeaturesPlan | null>(null);
  const nombre = configuracion?.nombreMostrar || "Tattoo Desk";

  useEffect(() => {
    fetch("/api/plan/features")
      .then((r) => r.json())
      .then((d) => {
        if (d?.features) setFeatures(d.features);
      })
      .catch(() => undefined);
  }, []);

  const contenidoMenu = (
    <>
      <div className="mb-8 flex items-center gap-3">
        {configuracion?.logoUrl ? (
          <img
            src={configuracion.logoUrl}
            alt="Logo del estudio"
            className="h-11 w-11 rounded-[var(--radius)] object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-primary/15 text-sm font-bold text-primary">
            TD
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{nombre}</h1>
          <p className="text-xs text-muted-foreground">Gestión de estudio</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menu
          .filter((item) => {
            if (item.ruta === "/configuracion") {
              return !usuario?.rol || usuario.rol === "ADMIN";
            }
            if (item.ruta === "/finanzas") {
              return !usuario?.rol || usuario.rol === "ADMIN";
            }
            if (
              "feature" in item &&
              item.feature &&
              features &&
              !features[item.feature]
            ) {
              return false;
            }
            return true;
          })
          .map((item) => {
            const Icon = item.icono;
            const activo =
              pathname === item.ruta ||
              (item.ruta !== "/" && pathname.startsWith(item.ruta));

            return (
              <Link
                key={item.ruta}
                href={item.ruta}
                onClick={() => setAbierto(false)}
                className={`flex min-h-11 items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition ${
                  activo
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.nombre}
              </Link>
            );
          })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-5 w-5" />
        Cerrar sesión
      </button>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-border bg-card lg:hidden"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-4 lg:flex">
        {contenidoMenu}
      </aside>

      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-card p-4 shadow-xl">
            <button
              type="button"
              className="mb-4 ml-auto flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-border"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            {contenidoMenu}
          </aside>
        </div>
      )}
    </>
  );
}
