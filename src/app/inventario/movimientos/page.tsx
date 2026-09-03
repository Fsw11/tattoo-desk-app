"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Inventario = {
  id: number;
  nombre: string;
  cantidad: string | number;
  unidad: string | null;
};

type Tatuaje = {
  id: number;
  nombre: string;
  estado: string;
  cliente: {
    id: number;
    nombre: string;
  };
};

type Movimiento = {
  id: number;
  tipo: string;
  cantidad: string | number;
  motivo: string | null;
  fecha: string;

  inventario: {
    nombre: string;
    unidad: string | null;
  };

  usuario?: {
    nombre: string;
  } | null;

  tatuaje?: {
    id: number;
    nombre: string;
    cliente: {
      nombre: string;
    };
  } | null;
};

export default function MovimientosInventarioPage() {
  const [inventario, setInventario] = useState<Inventario[]>([]);

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const [tatuajes, setTatuajes] = useState<Tatuaje[]>([]);

  const [inventarioId, setInventarioId] = useState("");

  const [tipo, setTipo] = useState("ENTRADA");

  const [cantidad, setCantidad] = useState("");

  const [motivo, setMotivo] = useState("");

  const [tatuajeId, setTatuajeId] = useState("");

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  // FILTROS
  const [filtroMaterial, setFiltroMaterial] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("");

  const [busqueda, setBusqueda] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [respuestaInventario, respuestaMovimientos, respuestaTatuajes] =
        await Promise.all([
          fetch("/api/inventario"),

          fetch("/api/movimientos-inventario"),

          fetch("/api/tatuajes"),
        ]);

      const inventarioData = await respuestaInventario.json();

      const movimientosData = await respuestaMovimientos.json();

      const tatuajesData = await respuestaTatuajes.json();

      if (!respuestaInventario.ok) {
        throw new Error(inventarioData.error || "Error al cargar inventario");
      }

      if (!respuestaMovimientos.ok) {
        throw new Error(movimientosData.error || "Error al cargar movimientos");
      }

      setInventario(inventarioData);

      setMovimientos(movimientosData);

      setTatuajes(tatuajesData);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al cargar datos"
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function crearMovimiento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!inventarioId) {
      setError("Selecciona un material.");
      return;
    }

    if (!cantidad || Number(cantidad) <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch("/api/movimientos-inventario", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          inventarioId: Number(inventarioId),

          tipo,

          cantidad,

          motivo,

          tatuajeId: tipo === "SALIDA" && tatuajeId ? Number(tatuajeId) : null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo guardar");
      }

      setCantidad("");
      setMotivo("");
      setTatuajeId("");

      await cargarDatos();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al guardar movimiento"
      );
    } finally {
      setGuardando(false);
    }
  }

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((movimiento) => {
      const coincideMaterial =
        !filtroMaterial || movimiento.inventario.nombre === filtroMaterial;

      const coincideTipo = !filtroTipo || movimiento.tipo === filtroTipo;

      const texto = `
              ${movimiento.inventario.nombre}
              ${movimiento.motivo ?? ""}
              ${movimiento.usuario?.nombre ?? ""}
              ${movimiento.tatuaje?.nombre ?? ""}
              ${movimiento.tatuaje?.cliente?.nombre ?? ""}
            `.toLowerCase();

      const coincideBusqueda =
        !busqueda || texto.includes(busqueda.toLowerCase());

      return coincideMaterial && coincideTipo && coincideBusqueda;
    });
  }, [movimientos, filtroMaterial, filtroTipo, busqueda]);

  const totalEntradas = movimientos
    .filter((movimiento) => movimiento.tipo === "ENTRADA")
    .reduce((total, movimiento) => total + Number(movimiento.cantidad), 0);

  const totalSalidas = movimientos
    .filter((movimiento) => movimiento.tipo === "SALIDA")
    .reduce((total, movimiento) => total + Number(movimiento.cantidad), 0);

  function formatoFecha(fecha: string) {
    return new Date(fecha).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="min-h-screen bg-muted/40 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Control de materiales
            </p>

            <h1 className="text-3xl font-bold">Movimientos de inventario</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Registra y consulta las entradas y salidas de materiales.
            </p>
          </div>

          <Link
            href="/inventario"
            className="inline-flex w-fit items-center rounded-lg border bg-background px-4 py-2 font-medium transition hover:bg-muted"
          >
            ← Volver a inventario
          </Link>
        </header>

        {/* RESUMEN */}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-background p-5">
            <p className="text-sm text-muted-foreground">
              Movimientos registrados
            </p>

            <p className="mt-2 text-3xl font-bold">{movimientos.length}</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Historial total
            </p>
          </div>

          <div className="rounded-xl border bg-background p-5">
            <p className="text-sm text-muted-foreground">Total entradas</p>

            <p className="mt-2 text-3xl font-bold">+{totalEntradas}</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Unidades registradas
            </p>
          </div>

          <div className="rounded-xl border bg-background p-5">
            <p className="text-sm text-muted-foreground">Total salidas</p>

            <p className="mt-2 text-3xl font-bold">-{totalSalidas}</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Unidades utilizadas
            </p>
          </div>
        </section>

        {/* FORMULARIO */}

        <section className="rounded-xl border bg-background p-5 md:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Registrar movimiento</h2>

            <p className="text-sm text-muted-foreground">
              Actualiza las existencias de un material.
            </p>
          </div>

          <form onSubmit={crearMovimiento} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={inventarioId}
                onChange={(e) => setInventarioId(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2"
                required
              >
                <option value="">Selecciona un material</option>

                {inventario.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                    {" — "}
                    Stock: {Number(item.cantidad)} {item.unidad ?? ""}
                  </option>
                ))}
              </select>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2"
              >
                <option value="ENTRADA">Entrada</option>

                <option value="SALIDA">Salida</option>
              </select>

              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="rounded-lg border px-3 py-2"
                required
              />

              <input
                placeholder="Motivo (opcional)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              {tipo === "SALIDA" && (
                <div className="rounded-xl border border-dashed bg-muted/20 p-4">
                  <div className="mb-3">
                    <p className="font-medium">
                      ¿En qué tatuaje se utilizó este material?
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Opcional. Esto permitirá conocer el costo de materiales
                      utilizados en cada tatuaje.
                    </p>
                  </div>

                  <select
                    value={tatuajeId}
                    onChange={(event) => setTatuajeId(event.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="">Sin asociar a un tatuaje</option>

                    {tatuajes.map((tatuaje) => (
                      <option key={tatuaje.id} value={tatuaje.id}>
                        {tatuaje.nombre} — {tatuaje.cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando
                  ? "Guardando..."
                  : tipo === "ENTRADA"
                    ? "Registrar entrada"
                    : "Registrar salida"}
              </button>
            </div>
          </form>
        </section>

        {/* HISTORIAL */}

        <section className="rounded-xl border bg-background">
          <div className="border-b p-5 md:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Historial de movimientos
              </h2>

              <p className="text-sm text-muted-foreground">
                Consulta todas las entradas y salidas registradas.
              </p>
            </div>

            {/* FILTROS */}

            <div className="grid gap-3 md:grid-cols-3">
              <input
                placeholder="Buscar material, motivo o usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />

              <select
                value={filtroMaterial}
                onChange={(e) => setFiltroMaterial(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2"
              >
                <option value="">Todos los materiales</option>

                {inventario.map((item) => (
                  <option key={item.id} value={item.nombre}>
                    {item.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2"
              >
                <option value="">Todos los movimientos</option>

                <option value="ENTRADA">Entradas</option>

                <option value="SALIDA">Salidas</option>
              </select>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Mostrando {movimientosFiltrados.length} movimiento
              {movimientosFiltrados.length === 1 ? "" : "s"}
            </p>
          </div>

          {cargando ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando movimientos...
            </div>
          ) : movimientosFiltrados.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl">📦</p>

              <p className="mt-3 font-medium">No hay movimientos registrados</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Registra una entrada o salida para comenzar el historial.
              </p>
            </div>
          ) : (
            <>
              {/* VISTA MOVIL */}

              <div className="space-y-3 p-3 md:hidden">
                {movimientosFiltrados.map((movimiento) => (
                  <div key={movimiento.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {movimiento.inventario.nombre}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatoFecha(movimiento.fecha)}
                        </p>
                      </div>

                      <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                        {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Cantidad
                        </p>

                        <p className="mt-1 font-semibold">
                          {movimiento.tipo === "ENTRADA" ? "+" : "-"}
                          {Number(movimiento.cantidad)}{" "}
                          {movimiento.inventario.unidad ?? ""}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Responsable
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {movimiento.usuario?.nombre ?? "Sistema"}
                        </p>
                      </div>
                    </div>

                    {movimiento.tatuaje && (
                      <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          Material utilizado en tatuaje
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {movimiento.tatuaje.nombre}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Cliente: {movimiento.tatuaje.cliente.nombre}
                        </p>
                      </div>
                    )}

                    {movimiento.motivo && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {movimiento.motivo}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* VISTA ESCRITORIO */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-sm">
                      <th className="px-5 py-3">Fecha</th>

                      <th className="px-5 py-3">Material</th>

                      <th className="px-5 py-3">Tipo</th>

                      <th className="px-5 py-3 text-right">Cantidad</th>

                      <th className="px-5 py-3">Motivo</th>

                      <th className="px-5 py-3">Tatuaje</th>

                      <th className="px-5 py-3">Usuario</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimientosFiltrados.map((movimiento) => (
                      <tr
                        key={movimiento.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {formatoFecha(movimiento.fecha)}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {movimiento.inventario.nombre}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full border px-3 py-1 text-sm">
                            {movimiento.tipo === "ENTRADA"
                              ? "Entrada"
                              : "Salida"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-semibold">
                          {movimiento.tipo === "ENTRADA" ? "+" : "-"}
                          {Number(movimiento.cantidad)}{" "}
                          {movimiento.inventario.unidad ?? ""}
                        </td>

                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {movimiento.motivo || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {movimiento.tatuaje ? (
                            <div>
                              <p className="font-medium">
                                {movimiento.tatuaje.nombre}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {movimiento.tatuaje.cliente.nombre}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {movimiento.tatuaje ? (
                            <div>
                              <p className="font-medium">
                                {movimiento.tatuaje.nombre}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {movimiento.tatuaje.cliente.nombre}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {movimiento.tatuaje ? (
                            <div>
                              <p className="font-medium">
                                {movimiento.tatuaje.nombre}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {movimiento.tatuaje.cliente.nombre}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {movimiento.usuario?.nombre ?? "Sistema"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
