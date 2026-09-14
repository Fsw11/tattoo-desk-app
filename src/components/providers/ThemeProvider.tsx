"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";
import { aplicarTokensTema } from "@/lib/theme";
import { EVENTO_TEMA_CAMBIADO } from "./theme-events";

type ConfiguracionTema = {
  tema?: string | null;
  colorPrincipal?: string | null;
  radio?: string | null;
};

type ThemeProviderProps = {
  children: ReactNode;
  configuracion?: ConfiguracionTema | null;
};

export default function ThemeProvider({
  children,
  configuracion,
}: ThemeProviderProps) {
  const [tema, setTema] = useState(configuracion?.tema || "system");
  const [colorPrincipal, setColorPrincipal] = useState(
    configuracion?.colorPrincipal || "#D4AF37",
  );
  const [radio, setRadio] = useState(configuracion?.radio || "medio");

  useEffect(() => {
    aplicarTokensTema({ tema, colorPrincipal, radio });
  }, [tema, colorPrincipal, radio]);

  useEffect(() => {
    function onSystemChange() {
      if (tema === "system") {
        aplicarTokensTema({ tema, colorPrincipal, radio });
      }
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [tema, colorPrincipal, radio]);

  useEffect(() => {
    function manejarCambio(event: Event) {
      const customEvent = event as CustomEvent<{
        tema?: string;
        colorPrincipal?: string;
        radio?: string;
      }>;

      if (customEvent.detail?.tema) setTema(customEvent.detail.tema);
      if (customEvent.detail?.colorPrincipal) {
        setColorPrincipal(customEvent.detail.colorPrincipal);
      }
      if (customEvent.detail?.radio) setRadio(customEvent.detail.radio);
    }

    window.addEventListener(EVENTO_TEMA_CAMBIADO, manejarCambio);
    return () =>
      window.removeEventListener(EVENTO_TEMA_CAMBIADO, manejarCambio);
  }, []);

  return <>{children}</>;
}
