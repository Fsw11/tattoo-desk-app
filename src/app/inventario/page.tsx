"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

type Item = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  cantidad: string | number;
  unidad: string | null;
  minimo: string | number | null;
  costo: string | number | null;
  activo: boolean;
};

export default function InventarioPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [soloBajo, setSoloBajo] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [entradaOpen, setEntradaOpen] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cantidad, setCantidad] = useState("0");
  const [unidad, setUnidad] = useState("pzas");
  const [minimo, setMinimo] = useState("");
  const [costo, setCosto] = useState("");
  const [entradaCantidad, setEntradaCantidad] = useState("");

  async function cargar() {
    try {
      setCargando(true);
      const res = await fetch("/api/inventario");
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "Error");
      setItems(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const stockBajoCount = items.filter(
    (i) => i.minimo != null && Number(i.cantidad) <= Number(i.minimo),
  ).length;

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (!i.activo) return false;
      if (soloBajo) {
        if (i.minimo == null || Number(i.cantidad) > Number(i.minimo))
          return false;
      }
      if (!term) return true;
      return (
        i.nombre.toLowerCase().includes(term) ||
        (i.categoria || "").toLowerCase().includes(term)
      );
    });
  }, [items, q, soloBajo]);

  function abrirNuevo() {
    setEditando(null);
    setNombre("");
    setCategoria("");
    setCantidad("0");
    setUnidad("pzas");
    setMinimo("");
    setCosto("");
    setError("");
    setModalOpen(true);
  }

  function abrirEditar(item: Item) {
    setEditando(item);
    setNombre(item.nombre);
    setCategoria(item.categoria || "");
    setCantidad(String(item.cantidad));
    setUnidad(item.unidad || "");
    setMinimo(item.minimo != null ? String(item.minimo) : "");
    setCosto(item.costo != null ? String(item.costo) : "");
    setError("");
    setModalOpen(true);
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setError("");
    try {
      if (editando) {
        const res = await fetch("/api/inventario", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editando.id,
            nombre: nombre.trim(),
            categoria: categoria.trim() || null,
            unidad: unidad.trim() || null,
            minimo: minimo || null,
            costo: costo || null,
          }),
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || "Error");
      } else {
        const res = await fetch("/api/inventario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombre.trim(),
            categoria: categoria.trim() || null,
            cantidad: Number(cantidad) || 0,
            unidad: unidad.trim() || null,
            minimo: minimo || null,
            costo: costo || null,
          }),
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || "Error");
      }
      setModalOpen(false);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  async function registrarEntrada(event: FormEvent) {
    event.preventDefault();
    if (!seleccionado) return;
    setGuardando(true);
    setError("");
    try {
      const res = await fetch("/api/movimientos-inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventarioId: seleccionado.id,
          tipo: "ENTRADA",
          cantidad: Number(entradaCantidad),
          motivo: "Entrada rápida",
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "Error");
      setEntradaOpen(false);
      setEntradaCantidad("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PageShell
      title="Inventario"
      description={`${items.filter((i) => i.activo).length} materiales`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/pos"
            className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-4 text-sm"
          >
            Ir a POS
          </Link>
          <Link
            href="/inventario/movimientos"
            className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-4 text-sm"
          >
            Movimientos
          </Link>
          <Button onClick={abrirNuevo}>Nuevo material</Button>
        </div>
      }
    >
      {stockBajoCount > 0 && (
        <Card className="border-warning/40 bg-warning/10">
          <p className="text-sm font-semibold text-warning">
            {stockBajoCount} material(es) con stock bajo
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar material o categoría..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-md"
        />
        <Button
          size="sm"
          variant={soloBajo ? "primary" : "outline"}
          onClick={() => setSoloBajo((v) => !v)}
        >
          Solo stock bajo
        </Button>
      </div>

      {error && !modalOpen && !entradaOpen && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            filtrados.map((item) => {
              const bajo =
                item.minimo != null &&
                Number(item.cantidad) <= Number(item.minimo);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSeleccionado(item)}
                  className={`rounded-[var(--radius)] border p-4 text-left transition hover:border-primary ${
                    seleccionado?.id === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{item.nombre}</h3>
                    {bajo && <Badge tone="warning">Bajo</Badge>}
                  </div>
                  <p className="text-sm">
                    {Number(item.cantidad)}
                    {item.unidad ? ` ${item.unidad}` : ""}
                  </p>
                  {item.categoria && (
                    <p className="text-xs text-muted-foreground">
                      {item.categoria}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-card p-4">
          {!seleccionado ? (
            <p className="text-sm text-muted-foreground">
              Selecciona un material
            </p>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{seleccionado.nombre}</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd>
                    {Number(seleccionado.cantidad)}
                    {seleccionado.unidad
                      ? ` ${seleccionado.unidad}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Mínimo</dt>
                  <dd>
                    {seleccionado.minimo != null
                      ? Number(seleccionado.minimo)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Costo</dt>
                  <dd>
                    {seleccionado.costo != null
                      ? `$${Number(seleccionado.costo).toLocaleString("es-MX")}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Categoría</dt>
                  <dd>{seleccionado.categoria || "—"}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => abrirEditar(seleccionado)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEntradaCantidad("");
                    setEntradaOpen(true);
                  }}
                >
                  Entrada rápida
                </Button>
                <Link
                  href="/pos"
                  className="inline-flex min-h-9 items-center rounded-[var(--radius)] border border-border px-3 text-sm"
                >
                  Usar en POS
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? "Editar material" : "Nuevo material"}
      >
        <form onSubmit={guardar} className="space-y-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <Input
            label="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
          {!editando && (
            <Input
              label="Cantidad inicial"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Unidad"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            />
            <Input
              label="Mínimo"
              type="number"
              value={minimo}
              onChange={(e) => setMinimo(e.target.value)}
            />
            <Input
              label="Costo"
              type="number"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
            />
          </div>
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

      <Modal
        open={entradaOpen}
        onClose={() => setEntradaOpen(false)}
        title={`Entrada · ${seleccionado?.nombre || ""}`}
        size="sm"
      >
        <form onSubmit={registrarEntrada} className="space-y-4">
          <Input
            label="Cantidad entrante"
            type="number"
            value={entradaCantidad}
            onChange={(e) => setEntradaCantidad(e.target.value)}
            required
            min={0.01}
            step="any"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEntradaOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              Registrar
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
