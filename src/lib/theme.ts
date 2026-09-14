export const ACENTOS_PRESET = [
  { id: "oro", label: "Oro", color: "#D4AF37" },
  { id: "tinta", label: "Tinta", color: "#6366F1" },
  { id: "carmin", label: "Carmín", color: "#E11D48" },
  { id: "esmeralda", label: "Esmeralda", color: "#10B981" },
  { id: "cobre", label: "Cobre", color: "#C2410C" },
  { id: "plata", label: "Plata", color: "#94A3B8" },
] as const;

export type RadioUI = "compacto" | "medio" | "suave";

export function luminanciaHex(hex: string): number {
  const limpio = hex.replace("#", "");
  if (limpio.length !== 6) return 0.5;

  const r = parseInt(limpio.slice(0, 2), 16) / 255;
  const g = parseInt(limpio.slice(2, 4), 16) / 255;
  const b = parseInt(limpio.slice(4, 6), 16) / 255;

  const canal = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contrasteSobreAcento(hex: string): string {
  return luminanciaHex(hex) > 0.55 ? "#0a0a0a" : "#ffffff";
}

export function radioCss(radio: string | null | undefined): string {
  switch (radio) {
    case "compacto":
      return "0.5rem";
    case "suave":
      return "1.25rem";
    default:
      return "0.75rem";
  }
}

export function aplicarTokensTema(options: {
  tema: string;
  colorPrincipal: string;
  radio?: string | null;
}) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const esOscuro =
    options.tema === "dark" || (options.tema === "system" && prefersDark);

  root.classList.toggle("dark", esOscuro);
  root.style.setProperty("--primary", options.colorPrincipal);
  root.style.setProperty(
    "--primary-foreground",
    contrasteSobreAcento(options.colorPrincipal),
  );
  root.style.setProperty("--radius", radioCss(options.radio));
}
