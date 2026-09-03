"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  EVENTO_TEMA_CAMBIADO,
} from "./theme-events";

type ConfiguracionTema = {
  tema?: string | null;
  colorPrincipal?: string | null;
};

type ThemeProviderProps = {
  children: ReactNode;
  configuracion?: ConfiguracionTema | null;
};

export default function ThemeProvider({
  children,
  configuracion,
}: ThemeProviderProps) {

  const [tema, setTema] = useState(
    configuracion?.tema || "dark"
  );

  const [colorPrincipal, setColorPrincipal] =
    useState(
      configuracion?.colorPrincipal ||
      "#D4AF37"
    );


  function aplicarConfiguracion(
    nuevoTema: string,
    nuevoColor: string
  ) {

    const root =
      document.documentElement;

    if (nuevoTema === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.style.setProperty(
      "--color-principal",
      nuevoColor
    );

  }


  useEffect(() => {

    aplicarConfiguracion(
      tema,
      colorPrincipal
    );

  }, [
    tema,
    colorPrincipal,
  ]);


  useEffect(() => {

    function manejarCambio(
      event: Event
    ) {

      const customEvent =
        event as CustomEvent<{
          tema?: string;
          colorPrincipal?: string;
        }>;

      const nuevoTema =
        customEvent.detail?.tema ||
        tema;

      const nuevoColor =
        customEvent.detail?.colorPrincipal ||
        colorPrincipal;

      setTema(nuevoTema);
      setColorPrincipal(nuevoColor);

    }

    window.addEventListener(
      EVENTO_TEMA_CAMBIADO,
      manejarCambio
    );

    return () => {

      window.removeEventListener(
        EVENTO_TEMA_CAMBIADO,
        manejarCambio
      );

    };

  }, [
    tema,
    colorPrincipal,
  ]);


  return <>{children}</>;
}
