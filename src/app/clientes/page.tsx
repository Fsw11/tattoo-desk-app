"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ClienteCard, { type ClienteLite } from "@/components/clientes/ClienteCard";
import ClienteDetallePanel from "@/components/clientes/ClienteDetallePanel";
import ClienteFormModal from "@/components/clientes/ClienteFormModal";
import ClienteFichaModal from "@/components/clientes/ClienteFichaModal";

type Filtro = "" | "alergias" | "activos" | "firmados";

type ClienteDetalle = ClienteLite & {
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteLite[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<ClienteDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [fichaId, setFichaId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const params = new URLSearchParams({
        lite: "1",
        limit: "80",
      });
      if (qDebounced) params.set("q", qDebounced);
      if (filtro) params.set("filtro", filtro);
      const res = await fetch(`/api/clientes?${params}`, { cache: "no-store" });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "Error al cargar");
      setClientes(datos.clientes || []);
      setTotal(datos.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, [qDebounced, filtro]);

  useEffect(() => {
    if (!seleccionado) {
      setDetalle(null);
      return;
    }
    const lite = clientes.find((c) => c.id === seleccionado) || null;
    setDetalle(lite);
    fetch(`/api/clientes/${seleccionado}`)
      .then((r) => r.json())
      .then((full) => {
        if (full?.id) {
          const base: ClienteLite = lite || {
            id: full.id,
            nombre: full.nombre,
            telefono: full.telefono,
            email: full.email,
            instagram: full.instagram,
            tieneAlergias: Boolean(full.alergias || full.enfermedades),
            tatuajesCount: full.tatuajes?.length || 0,
            firmasCount: full.consentimientos?.length || 0,
            tatuajeActivo: null,
            creadoEn: full.creadoEn,
          };
          setDetalle({
            ...base,
            alergias: full.alergias,
            enfermedades: full.enfermedades,
            notas: full.notas,
            direccion: full.direccion,
            tatuajes: full.tatuajes,
            firmasCount: full.consentimientos?.length ?? base.firmasCount,
            tieneAlergias: Boolean(full.alergias || full.enfermedades),
          });
        }
      })
      .catch(() => undefined);
  }, [seleccionado, clientes]);

  const agrupados = useMemo(() => {
    if (qDebounced) return null;
    const map = new Map<string, ClienteLite[]>();
    for (const c of clientes) {
      const letra = (c.nombre[0] || "#").toUpperCase();
      const key = /[A-ZÁÉÍÓÚÑ]/.test(letra) ? letra : "#";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [clientes, qDebounced]);

  function onSelect(id: string) {
    setSeleccionado(id);
  }

  return (
    <PageShell
      title="Clientes"
      description={`${total} en tu estudio`}
      actions={
        <Button onClick={() => setMostrarForm(true)}>Nuevo cliente</Button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre, teléfono o Instagram..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["", "Todos"],
              ["alergias", "Salud"],
              ["activos", "Activos"],
              ["firmados", "Firmados"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value || "all"}
              size="sm"
              variant={filtro === value ? "primary" : "outline"}
              onClick={() => setFiltro(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : clientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay clientes con esos filtros.
            </p>
          ) : agrupados ? (
            agrupados.map(([letra, lista]) => (
              <div key={letra} className="space-y-2">
                <p className="sticky top-0 z-[1] bg-background/90 px-1 text-xs font-bold text-muted-foreground backdrop-blur">
                  {letra}
                </p>
                {lista.map((c) => (
                  <ClienteCard
                    key={c.id}
                    cliente={c}
                    seleccionado={seleccionado === c.id}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ))
          ) : (
            clientes.map((c) => (
              <ClienteCard
                key={c.id}
                cliente={c}
                seleccionado={seleccionado === c.id}
                onSelect={onSelect}
              />
            ))
          )}
        </div>

        <div className={seleccionado ? "block" : "hidden lg:block"}>
          <ClienteDetallePanel
            cliente={detalle}
            onClose={() => setSeleccionado(null)}
            onVerFicha={() => seleccionado && setFichaId(seleccionado)}
          />
        </div>
      </div>

      <ClienteFormModal
        open={mostrarForm}
        onClose={() => setMostrarForm(false)}
        onSaved={(c) => {
          void cargar();
          setSeleccionado(c.id);
        }}
      />

      <ClienteFichaModal
        open={Boolean(fichaId)}
        clienteId={fichaId}
        onClose={() => setFichaId(null)}
        onUpdated={() => void cargar()}
      />
    </PageShell>
  );
}
