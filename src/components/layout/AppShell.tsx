"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";

type Configuracion = {
  logoUrl: string | null;
  nombreMostrar: string | null;
};

type Usuario = {
  name?: string | null;
  email?: string | null;
  rol?: "ADMIN" | "TATUADOR" | "RECEPCION";
};

type AppShellProps = {
  children: ReactNode;
  configuracion: Configuracion | null;
  usuario: Usuario | null;
};

export default function AppShell({
  children,
  configuracion,
  usuario,
}: AppShellProps) {

  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden">

      <Sidebar
        configuracion={configuracion}
        usuario={usuario}
      />

      <div className="flex min-w-0 flex-1 flex-col">

        <Header
          configuracion={configuracion}
          usuario={usuario}
        />

        <main className="min-w-0 flex-1 pt-16 lg:pt-0">
          {children}
        </main>

      </div>

    </div>
  );
}
