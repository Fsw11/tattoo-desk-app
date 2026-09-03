"use client";

import {
  ReactNode,
  useEffect,
} from "react";

import {
  EVENTO_TEMA_CAMBIADO,
} from "./theme-events";

type Configuracion = {
  tema: string;
  colorPrincipal: string;
};

export default function ThemeProvider({
  children,
  configuracion,
}: {
  children: ReactNode;
  configuracion: Configuracion | null;
}) {

  useEffect(() => {

    function aplicarTema(
      datos: {
        tema?: string;
        colorPrincipal?: string;
      }
    ) {

      const root =
        document.documentElement;

      if (datos.tema === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      if (datos.colorPrincipal) {
        root.style.setProperty(
          "--primary",
          datos.colorPrincipal
        );
      }
    }


    aplicarTema(configuracion ?? {});


    function manejarCambioTema(
      evento: Event
    ) {

      const eventoPersonalizado =
        evento as CustomEvent<{
          tema?: string;
          colorPrincipal?: string;
        }>;

      aplicarTema(
        eventoPersonalizado.detail ?? {}
      );
    }


    window.addEventListener(
      EVENTO_TEMA_CAMBIADO,
      manejarCambioTema
    );


    return () => {

      window.removeEventListener(
        EVENTO_TEMA_CAMBIADO,
        manejarCambioTema
      );

    };

  }, [configuracion]);


  return (
    <>
      {children}
    </>
  );
}
