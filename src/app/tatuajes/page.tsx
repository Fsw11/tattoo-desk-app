"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import TatuadorSelect from "@/components/ui/TatuadorSelect";

type Cliente = { id: string; nombre: string; telefono: string };

type Tatuaje = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estilo: string | null;
  zona: string | null;
  precio: string | number | null;
  anticipo: string | number | null;
  estado: string;
  notas: string | null;
  cliente: Cliente;
  usuario: { id: number; nombre: string } | null;
  pagos?: Array<{ id: string; monto: string | number; fecha: string }>;
};

const ESTADOS = ["PENDIENTE", "EN_PROCESO", "TERMINADO", "CANCELADO"] as const;

function toneEstado(estado: string) {
  switch (estado) {
    case "TERMINADO":
      return "success" as const;
    case "EN_PROCESO":
      return "primary" as const;
    case "CANCELADO":
      return "danger" as const;
    default:
      return "warning" as const;
  }
}

export default function TatuajesPage() {
  const [tatuajes, setTatuajes] = useState<Tatuaje[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [tatuadorFiltro, setTatuadorFiltro] = useState("");
  const [seleccionado, setSeleccionado] = useState<Tatuaje | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Tatuaje | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [nombre, setNombre] = useState("");
  const [estilo, setEstilo] = useState("");
  const [zona, setZona] = useState("");
  const [precio, setPrecio] = useState("");
  const [anticipo, setAnticipo] = useState("");
  const [notas, setNotas] = useState("");
  const [estado, setEstado] = useState("PENDIENTE");
  const [usuarioId, setUsuarioId] = useState("");

  async function cargar() {
    try {
      setCargando(true);
      const [resT, resC] = await Promise.all([
        fetch("/api/tatuajes"),
        fetch("/api/clientes/select"),
      ]);
      const datosT = await resT.json();
      const datosC = await resC.json();
      if (!resT.ok) throw new Error(datosT.error || "Error al cargar");
      setTatuajes(Array.isArray(datosT) ? datosT : []);
      setClientes(Array.isArray(datosC) ? datosC : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tatuajes.filter((t) => {
      if (estadoFiltro && t.estado !== estadoFiltro) return false;
      if (tatuadorFiltro && String(t.usuario?.id || "") !== tatuadorFiltro)
        return false;
      if (!term) return true;
      return (
        t.nombre.toLowerCase().includes(term) ||
        t.cliente?.nombre.toLowerCase().includes(term) ||
        (t.zona || "").toLowerCase().includes(term) ||
        (t.estilo || "").toLowerCase().includes(term)
      );
    });
  }, [tatuajes, q, estadoFiltro, tatuadorFiltro]);

  function abrirNuevo() {
    setEditando(null);
    setClienteId("");
    setNombre("");
    setEstilo("");
    setZona("");
    setPrecio("");
    setAnticipo("");
    setNotas("");
    setEstado("PENDIENTE");
    setUsuarioId("");
    setError("");
    setModalOpen(true);
  }

  function abrirEditar(t: Tatuaje) {
    setEditando(t);
    setClienteId(t.cliente.id);
    setNombre(t.nombre);
    setEstilo(t.estilo || "");
    setZona(t.zona || "");
    setPrecio(t.precio != null ? String(t.precio) : "");
    setAnticipo(t.anticipo != null ? String(t.anticipo) : "");
    setNotas(t.notas || "");
    setEstado(t.estado);
    setUsuarioId(t.usuario?.id != null ? String(t.usuario.id) : "");
    setError("");
    setModalOpen(true);
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const payload = {
        clienteId,
        nombre: nombre.trim(),
        estilo: estilo.trim() || null,
        zona: zona.trim() || null,
        precio: precio || null,
        anticipo: anticipo || null,
        notas: notas.trim() || null,
        estado,
        usuarioId: usuarioId ? Number(usuarioId) : null,
      };

      const res = await fetch("/api/tatuajes", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editando ? { id: editando.id, ...payload } : payload,
        ),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "No se pudo guardar");
      setModalOpen(false);
      await cargar();
      if (editando) {
        const refreshed = (await fetch("/api/tatuajes").then((r) => r.json())) as Tatuaje[];
        setSeleccionado(refreshed.find((x) => x.id === editando.id) || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PageShell
      title="Tatuajes"
      description="Trabajos activos y terminados"
      actions={<Button onClick={abrirNuevo}>Nuevo tatuaje</Button>}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <Input
          placeholder="Buscar por nombre, cliente, zona..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="lg:max-w-sm"
        />
        <Select
          label="Estado"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option value="">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
        <div className="lg:w-56">
          <TatuadorSelect
            label="Tatuador"
            value={tatuadorFiltro}
            onChange={setTatuadorFiltro}
            emptyLabel="Todos"
            autoSelectSingle={false}
          />
        </div>
      </div>

      {error && !modalOpen && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            filtrados.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSeleccionado(t)}
                className={`rounded-[var(--radius)] border p-4 text-left transition hover:border-primary ${
                  seleccionado?.id === t.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{t.nombre}</h3>
                  <Badge tone={toneEstado(t.estado)}>{t.estado}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.cliente?.nombre}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[t.zona, t.estilo, t.usuario?.nombre]
                    .filter(Boolean)
                    .join(" · ") || "Sin detalle"}
                </p>
                {t.precio != null && (
                  <p className="mt-2 text-sm font-medium">
                    ${Number(t.precio).toLocaleString("es-MX")}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-card p-4">
          {!seleccionado ? (
            <p className="text-sm text-muted-foreground">
              Selecciona un tatuaje para ver el detalle
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">{seleccionado.nombre}</h2>
                <p className="text-sm text-muted-foreground">
                  {seleccionado.cliente?.nombre}
                </p>
              </div>
              <Badge tone={toneEstado(seleccionado.estado)}>
                {seleccionado.estado}
              </Badge>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Tatuador</dt>
                  <dd>{seleccionado.usuario?.nombre || "Sin asignar"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Zona / estilo</dt>
                  <dd>
                    {[seleccionado.zona, seleccionado.estilo]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Precio / anticipo</dt>
                  <dd>
                    {seleccionado.precio != null
                      ? `$${Number(seleccionado.precio).toLocaleString("es-MX")}`
                      : "—"}
                    {seleccionado.anticipo != null
                      ? ` / ant. $${Number(seleccionado.anticipo).toLocaleString("es-MX")}`
                      : ""}
                  </dd>
                </div>
              </dl>
              {seleccionado.pagos && seleccionado.pagos.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium">Pagos recientes</p>
                  <ul className="space-y-1 text-sm">
                    {seleccionado.pagos.slice(0, 5).map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>
                          {new Date(p.fecha).toLocaleDateString("es-MX")}
                        </span>
                        <span>
                          ${Number(p.monto).toLocaleString("es-MX")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => abrirEditar(seleccionado)}>
                  Editar
                </Button>
                <Link
                  href={`/pos?clienteId=${seleccionado.cliente.id}&tatuajeId=${seleccionado.id}`}
                  className="inline-flex min-h-9 items-center rounded-[var(--radius)] border border-border px-3 text-sm"
                >
                  Abrir POS
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? "Editar tatuaje" : "Nuevo tatuaje"}
        size="lg"
      >
        <form onSubmit={guardar} className="space-y-4">
          <Select
            label="Cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            disabled={Boolean(editando)}
          >
            <option value="">Selecciona...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Zona"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
            />
            <Input
              label="Estilo"
              value={estilo}
              onChange={(e) => setEstilo(e.target.value)}
            />
            <Input
              label="Precio"
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
            <Input
              label="Anticipo"
              type="number"
              value={anticipo}
              onChange={(e) => setAnticipo(e.target.value)}
            />
          </div>
          <TatuadorSelect value={usuarioId} onChange={setUsuarioId} />
          {editando && (
            <Select
              label="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          )}
          <Input
            label="Notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
