"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import TatuadorSelect from "@/components/ui/TatuadorSelect";
import { usePuedeAsignarTatuador, useSessionUser } from "@/lib/rol-client";

type InventarioItem = {
  id: number;
  nombre: string;
  cantidad: string | number;
  unidad: string | null;
  minimo: string | number | null;
  costo: string | number | null;
  activo: boolean;
};

type Cliente = { id: string; nombre: string; telefono: string };
type Tatuaje = {
  id: string;
  nombre: string;
  estado: string;
  cliente: { id: string; nombre: string };
};

type CarritoItem = { inventarioId: number; nombre: string; cantidad: number };

type Modo = "sesion" | "entrada";

function PosInner() {
  const search = useSearchParams();
  const puedeAsignar = usePuedeAsignarTatuador();
  const sessionUser = useSessionUser();
  const [modo, setModo] = useState<Modo>("sesion");
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tatuajes, setTatuajes] = useState<Tatuaje[]>([]);
  const [clienteId, setClienteId] = useState(search.get("clienteId") || "");
  const [tatuajeId, setTatuajeId] = useState(search.get("tatuajeId") || "");
  const [tatuadorId, setTatuadorId] = useState("");
  const [busquedaMat, setBusquedaMat] = useState("");
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("EFECTIVO");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Entrada
  const [entradaId, setEntradaId] = useState("");
  const [entradaCantidad, setEntradaCantidad] = useState("");
  const [entradaNombre, setEntradaNombre] = useState("");
  const [entradaCosto, setEntradaCosto] = useState("");
  const [altaRapida, setAltaRapida] = useState(false);

  async function cargar() {
    const [inv, cli, tat] = await Promise.all([
      fetch("/api/inventario").then((r) => r.json()),
      fetch("/api/clientes/select").then((r) => r.json()),
      fetch("/api/tatuajes").then((r) => r.json()),
    ]);
    setInventario(Array.isArray(inv) ? inv.filter((i: InventarioItem) => i.activo) : []);
    setClientes(Array.isArray(cli) ? cli : []);
    setTatuajes(Array.isArray(tat) ? tat : []);
  }

  useEffect(() => {
    void cargar();
  }, []);

  const tatuajesFiltrados = useMemo(() => {
    if (!clienteId) return tatuajes.filter((t) => t.estado !== "CANCELADO");
    return tatuajes.filter(
      (t) => t.cliente?.id === clienteId && t.estado !== "CANCELADO",
    );
  }, [tatuajes, clienteId]);

  const materialesFiltrados = useMemo(() => {
    const q = busquedaMat.trim().toLowerCase();
    if (!q) return inventario;
    return inventario.filter((i) => i.nombre.toLowerCase().includes(q));
  }, [inventario, busquedaMat]);

  const stockBajo = inventario.filter((i) => {
    if (i.minimo == null) return false;
    return Number(i.cantidad) <= Number(i.minimo);
  });

  function agregarAlCarrito(item: InventarioItem) {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.inventarioId === item.id);
      if (existe) {
        return prev.map((p) =>
          p.inventarioId === item.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p,
        );
      }
      return [
        ...prev,
        { inventarioId: item.id, nombre: item.nombre, cantidad: 1 },
      ];
    });
  }

  async function cobrarSesion(event: FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const res = await fetch("/api/pos/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: clienteId || null,
          tatuajeId: tatuajeId || null,
          tatuadorId: tatuadorId ? Number(tatuadorId) : null,
          materiales: carrito.map((c) => ({
            inventarioId: c.inventarioId,
            cantidad: c.cantidad,
          })),
          pago: monto
            ? {
                monto: Number(monto),
                metodo,
                concepto: "Sesión POS",
              }
            : undefined,
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "Error al registrar");
      setMensaje("Sesión registrada.");
      setCarrito([]);
      setMonto("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  async function registrarEntrada(event: FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      let inventarioId = entradaId ? Number(entradaId) : 0;

      if (altaRapida) {
        if (!entradaNombre.trim()) throw new Error("Nombre del material requerido.");
        const crear = await fetch("/api/inventario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: entradaNombre.trim(),
            cantidad: 0,
            costo: entradaCosto || null,
            unidad: "pzas",
          }),
        });
        const nuevo = await crear.json();
        if (!crear.ok) throw new Error(nuevo.error || "No se pudo crear material");
        inventarioId = nuevo.id;
      }

      if (!inventarioId || !entradaCantidad) {
        throw new Error("Selecciona material y cantidad.");
      }

      const res = await fetch("/api/movimientos-inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventarioId,
          tipo: "ENTRADA",
          cantidad: Number(entradaCantidad),
          motivo: "Entrada POS",
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "Error en entrada");
      setMensaje("Entrada registrada.");
      setEntradaCantidad("");
      setEntradaNombre("");
      setEntradaId("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PageShell
      title="Punto de venta"
      description="Entradas de material y salidas/cobros por sesión."
      actions={
        <Link href="/finanzas" className="text-sm text-primary underline">
          Ver finanzas
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={modo === "sesion" ? "primary" : "outline"}
          onClick={() => setModo("sesion")}
        >
          Sesión / salida
        </Button>
        <Button
          size="sm"
          variant={modo === "entrada" ? "primary" : "outline"}
          onClick={() => setModo("entrada")}
        >
          Entrada de material
        </Button>
      </div>

      {stockBajo.length > 0 && (
        <Card className="border-warning/40 bg-warning/10">
          <p className="mb-2 text-sm font-semibold text-warning">
            Stock bajo
          </p>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map((i) => (
              <Badge key={i.id} tone="warning">
                {i.nombre}: {Number(i.cantidad)}
                {i.unidad ? ` ${i.unidad}` : ""}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {mensaje && (
        <p className="rounded-[var(--radius)] border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {mensaje}
        </p>
      )}
      {error && (
        <p className="rounded-[var(--radius)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {modo === "sesion" ? (
        <form onSubmit={cobrarSesion} className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4">
            <Select
              label="Cliente"
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setTatuajeId("");
              }}
            >
              <option value="">Opcional</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Select
              label="Tatuaje / trabajo"
              value={tatuajeId}
              onChange={(e) => {
                setTatuajeId(e.target.value);
                const t = tatuajes.find((x) => x.id === e.target.value);
                if (t?.cliente?.id) setClienteId(t.cliente.id);
              }}
            >
              <option value="">Opcional</option>
              {tatuajesFiltrados.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} · {t.cliente?.nombre} ({t.estado})
                </option>
              ))}
            </Select>
            {puedeAsignar ? (
              <TatuadorSelect
                label="Tatuador que realiza la pieza"
                value={tatuadorId}
                onChange={setTatuadorId}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Tatuador: tú ({sessionUser?.nombre || "sesión"})
              </p>
            )}

            <Input
              label="Buscar material"
              value={busquedaMat}
              onChange={(e) => setBusquedaMat(e.target.value)}
              placeholder="Agujas, tinta..."
            />
            <div className="grid max-h-72 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
              {materialesFiltrados.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => agregarAlCarrito(item)}
                  className="rounded-[var(--radius)] border border-border p-3 text-left hover:border-primary hover:bg-primary/10"
                >
                  <p className="text-sm font-semibold">{item.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock {Number(item.cantidad)}
                    {item.unidad ? ` ${item.unidad}` : ""}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Carrito de sesión</h2>
            {carrito.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Toca materiales para agregarlos.
              </p>
            ) : (
              <ul className="space-y-2">
                {carrito.map((c) => (
                  <li
                    key={c.inventarioId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm">{c.nombre}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCarrito((prev) =>
                            prev
                              .map((p) =>
                                p.inventarioId === c.inventarioId
                                  ? { ...p, cantidad: Math.max(0, p.cantidad - 1) }
                                  : p,
                              )
                              .filter((p) => p.cantidad > 0),
                          )
                        }
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm">{c.cantidad}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCarrito((prev) =>
                            prev.map((p) =>
                              p.inventarioId === c.inventarioId
                                ? { ...p, cantidad: p.cantidad + 1 }
                                : p,
                            ),
                          )
                        }
                      >
                        +
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Cobro (opcional)"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
              />
              <Select
                label="Método"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="OTRO">Otro</option>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={guardando}>
              {guardando ? "Registrando..." : "Registrar sesión"}
            </Button>
          </Card>
        </form>
      ) : (
        <form onSubmit={registrarEntrada} className="mx-auto max-w-lg space-y-4">
          <Card className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={altaRapida}
                onChange={(e) => setAltaRapida(e.target.checked)}
              />
              Alta rápida de material nuevo
            </label>
            {altaRapida ? (
              <>
                <Input
                  label="Nombre"
                  value={entradaNombre}
                  onChange={(e) => setEntradaNombre(e.target.value)}
                  required
                />
                <Input
                  label="Costo unitario"
                  type="number"
                  value={entradaCosto}
                  onChange={(e) => setEntradaCosto(e.target.value)}
                />
              </>
            ) : (
              <Select
                label="Material"
                value={entradaId}
                onChange={(e) => setEntradaId(e.target.value)}
                required
              >
                <option value="">Selecciona...</option>
                {inventario.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} (stock {Number(i.cantidad)})
                  </option>
                ))}
              </Select>
            )}
            <Input
              label="Cantidad entrante"
              type="number"
              value={entradaCantidad}
              onChange={(e) => setEntradaCantidad(e.target.value)}
              required
              min={0.01}
              step="any"
            />
            <Button type="submit" className="w-full" disabled={guardando}>
              {guardando ? "Guardando..." : "Registrar entrada"}
            </Button>
          </Card>
        </form>
      )}
    </PageShell>
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<main className="p-6">Cargando POS...</main>}>
      <PosInner />
    </Suspense>
  );
}
