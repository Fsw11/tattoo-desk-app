"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";

export type ClienteLite = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  instagram: string | null;
  tieneAlergias: boolean;
  tatuajesCount: number;
  firmasCount: number;
  tatuajeActivo: { id: string; nombre: string; estado: string } | null;
  creadoEn: string;
};

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export default function ClienteCard({
  cliente,
  seleccionado,
  onSelect,
}: {
  cliente: ClienteLite;
  seleccionado?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cliente.id)}
      className={`flex w-full items-start gap-3 rounded-[var(--radius)] border p-3 text-left transition ${
        seleccionado
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
        {iniciales(cliente.nombre) || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{cliente.nombre}</p>
          {cliente.tieneAlergias && <Badge tone="warning">Salud</Badge>}
          {cliente.firmasCount > 0 && <Badge tone="success">Firmado</Badge>}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {cliente.telefono}
          {cliente.instagram ? ` · ${cliente.instagram}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {cliente.tatuajesCount} tatuaje
          {cliente.tatuajesCount === 1 ? "" : "s"}
          {cliente.tatuajeActivo
            ? ` · activo: ${cliente.tatuajeActivo.nombre}`
            : ""}
        </p>
      </div>
      <Link
        href={`/clientes/${cliente.id}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 text-xs text-primary underline lg:hidden"
      >
        Abrir
      </Link>
    </button>
  );
}
