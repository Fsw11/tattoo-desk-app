"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { ClienteLite } from "./ClienteCard";

type Detalle = ClienteLite & {
  direccion?: string | null;
  alergias?: string | null;
  enfermedades?: string | null;
  notas?: string | null;
  tatuajes?: Array<{
    id: string;
    nombre: string;
    estado: string;
    zona: string | null;
  }>;
};

export default function ClienteDetallePanel({
  cliente,
  onClose,
  onVerFicha,
}: {
  cliente: Detalle | null;
  onClose: () => void;
  onVerFicha?: () => void;
}) {
  if (!cliente) {
    return (
      <div className="hidden h-full items-center justify-center rounded-[var(--radius)] border border-dashed border-border p-8 text-center text-sm text-muted-foreground lg:flex">
        Selecciona un cliente para ver su ficha
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[var(--radius)] border border-border bg-card p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{cliente.nombre}</h2>
          <p className="text-sm text-muted-foreground">{cliente.telefono}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} className="lg:hidden">
          Cerrar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {cliente.tieneAlergias && <Badge tone="warning">Datos de salud</Badge>}
        {cliente.firmasCount > 0 ? (
          <Badge tone="success">{cliente.firmasCount} firma(s)</Badge>
        ) : (
          <Badge tone="danger">Sin consentimiento</Badge>
        )}
      </div>

      {(cliente.alergias || cliente.enfermedades) && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
          {cliente.alergias && <p>Alergias: {cliente.alergias}</p>}
          {cliente.enfermedades && <p>Enfermedades: {cliente.enfermedades}</p>}
        </div>
      )}

      {cliente.tatuajes && cliente.tatuajes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Tatuajes</p>
          <ul className="space-y-2">
            {cliente.tatuajes.slice(0, 6).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  {t.nombre}
                  {t.zona ? ` · ${t.zona}` : ""}
                </span>
                <Badge>{t.estado}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onVerFicha}>
          Ficha completa
        </Button>
        <Link
          href={`/consentimiento?clienteId=${cliente.id}`}
          className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-4 text-sm"
        >
          Consentimiento
        </Link>
        <Link
          href={`/pos?clienteId=${cliente.id}`}
          className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-4 text-sm"
        >
          Abrir POS
        </Link>
        <Link
          href={`/citas`}
          className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-4 text-sm"
        >
          Agendar
        </Link>
      </div>
    </div>
  );
}
