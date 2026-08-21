"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  {
    nombre: "Dashboard",
    ruta: "/dashboard",
  },
  {
    nombre: "Clientes",
    ruta: "/clientes",
  },
  {
    nombre: "Citas",
    ruta: "/citas",
  },
  {
    nombre: "Tatuajes",
    ruta: "/tatuajes",
  },
  {
    nombre: "Pagos",
    ruta: "/pagos",
  },
  {
    nombre: "Gastos",
    ruta: "/gastos",
  },
  {
    nombre: "Fotos",
    ruta: "/fotos",
  },
  {
    nombre: "Inventario",
    ruta: "/inventario",
  },
  {
    nombre: "Movimientos",
    ruta: "/inventario/movimientos",
  },
];


export default function Sidebar() {

  const pathname = usePathname();


  return (
    <aside className="min-h-screen w-64 border-r bg-background p-5">

      <h1 className="mb-8 text-xl font-bold">
        Tattoo Desk
      </h1>


      <nav className="space-y-2">

        {enlaces.map((enlace) => {

          const activo =
            pathname === enlace.ruta;


          return (
            <Link
              key={enlace.ruta}
              href={enlace.ruta}
              className={`block rounded-lg px-4 py-2 text-sm font-medium ${
                activo
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {enlace.nombre}
            </Link>
          );

        })}

      </nav>

    </aside>
  );
}
