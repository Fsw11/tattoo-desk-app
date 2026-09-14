"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ClienteFormModal, {
  type ClienteFormValues,
} from "./ClienteFormModal";

type FullCliente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  instagram: string | null;
  direccion: string | null;
  alergias: string | null;
  enfermedades: string | null;
  notas: string | null;
  tatuajes?: Array<{
    id: string;
    nombre: string;
    estado: string;
    zona: string | null;
  }>;
  citas?: Array<{
    id: string;
    fecha: string;
    estado: string;
    motivo: string | null;
  }>;
  consentimientos?: Array<{ id: string; creadoEn: string }>;
  pagos?: Array<{ id: string; monto: string | number; fecha: string }>;
};

type Props = {
  open: boolean;
  clienteId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function ClienteFichaModal({
  open,
  clienteId,
  onClose,
  onUpdated,
}: Props) {
  const [cliente, setCliente] = useState<FullCliente | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);

  async function cargar() {
    if (!clienteId) return;
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        cache: "no-store",
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "No se pudo cargar");
      setCliente(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (open && clienteId) {
      setEditando(false);
      void cargar();
    } else {
      setCliente(null);
    }
  }, [open, clienteId]);

  const iniciales: Partial<ClienteFormValues> | null = cliente
    ? {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email || "",
        instagram: cliente.instagram || "",
        direccion: cliente.direccion || "",
        alergias: cliente.alergias || "",
        enfermedades: cliente.enfermedades || "",
        notas: cliente.notas || "",
      }
    : null;

  return (
    <>
      <Modal
        open={open && !editando}
        onClose={onClose}
        title={cliente?.nombre || "Ficha de cliente"}
        size="xl"
      >
        {cargando && (
          <p className="text-sm text-muted-foreground">Cargando ficha...</p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        {cliente && !cargando && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {cliente.telefono}
                  {cliente.instagram ? ` · ${cliente.instagram}` : ""}
                </p>
                {cliente.email && (
                  <p className="text-sm text-muted-foreground">{cliente.email}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
                  Editar
                </Button>
                <Link
                  href={`/consentimiento?clienteId=${cliente.id}`}
                  className="inline-flex min-h-9 items-center rounded-[var(--radius)] border border-border px-3 text-sm"
                >
                  Firmar
                </Link>
                <Link
                  href={`/pos?clienteId=${cliente.id}`}
                  className="inline-flex min-h-9 items-center rounded-[var(--radius)] border border-border px-3 text-sm"
                >
                  POS
                </Link>
                <Link
                  href="/citas"
                  className="inline-flex min-h-9 items-center rounded-[var(--radius)] bg-primary px-3 text-sm font-medium text-primary-foreground"
                >
                  Agendar
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--radius)] border border-border p-4">
                <h3 className="mb-2 text-sm font-semibold">Contacto</h3>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Dirección</dt>
                    <dd>{cliente.direccion || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-[var(--radius)] border border-border p-4">
                <h3 className="mb-2 text-sm font-semibold">Salud</h3>
                <p className="text-sm">
                  <span className="text-muted-foreground">Alergias: </span>
                  {cliente.alergias || "—"}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Enfermedades: </span>
                  {cliente.enfermedades || "—"}
                </p>
              </div>
            </div>

            {cliente.notas && (
              <div className="rounded-[var(--radius)] border border-border p-4">
                <h3 className="mb-2 text-sm font-semibold">Notas</h3>
                <p className="text-sm whitespace-pre-wrap">{cliente.notas}</p>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold">Tatuajes</h3>
              {cliente.tatuajes && cliente.tatuajes.length > 0 ? (
                <ul className="space-y-2">
                  {cliente.tatuajes.map((t) => (
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
              ) : (
                <p className="text-sm text-muted-foreground">Sin tatuajes</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Citas recientes</h3>
              {cliente.citas && cliente.citas.length > 0 ? (
                <ul className="space-y-2">
                  {cliente.citas.slice(0, 8).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span>
                        {new Date(c.fecha).toLocaleString("es-MX")}
                        {c.motivo ? ` · ${c.motivo}` : ""}
                      </span>
                      <Badge>{c.estado}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sin citas</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>
                Firmas: {cliente.consentimientos?.length ?? 0}
              </span>
              <span>·</span>
              <span>Pagos: {cliente.pagos?.length ?? 0}</span>
              <span>·</span>
              <Link
                href={`/clientes/${cliente.id}`}
                className="text-primary underline"
              >
                Abrir página completa
              </Link>
            </div>
          </div>
        )}
      </Modal>

      <ClienteFormModal
        open={open && editando}
        onClose={() => setEditando(false)}
        clienteId={clienteId}
        iniciales={iniciales}
        title="Editar cliente"
        onSaved={() => {
          setEditando(false);
          void cargar();
          onUpdated?.();
        }}
      />
    </>
  );
}
