"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type InventarioItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  cantidad: string | number;
  unidad: string | null;
  minimo: string | number | null;
  costo: string | number | null;
  activo: boolean;
  creadoEn: string;
};

export default function InventarioPage() {
  const [items, setItems] =
    useState<InventarioItem[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [error, setError] =
    useState("");

  const [nombre, setNombre] =
    useState("");

  const [descripcion, setDescripcion] =
    useState("");

  const [categoria, setCategoria] =
    useState("");

  const [cantidad, setCantidad] =
    useState("");

  const [unidad, setUnidad] =
    useState("");

  const [minimo, setMinimo] =
    useState("");

  const [costo, setCosto] =
    useState("");


  async function cargarInventario() {
    try {
      setCargando(true);
      setError("");

      const respuesta =
        await fetch("/api/inventario");

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
          "No se pudo cargar el inventario."
        );
      }

      setItems(datos);

    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar inventario."
      );

    } finally {
      setCargando(false);
    }
  }


  useEffect(() => {
    cargarInventario();
  }, []);


  function limpiarFormulario() {
    setNombre("");
    setDescripcion("");
    setCategoria("");
    setCantidad("");
    setUnidad("");
    setMinimo("");
    setCosto("");
  }


  async function crearItem(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");

      const respuesta =
        await fetch(
          "/api/inventario",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              nombre,
              descripcion,
              categoria,
              cantidad,
              unidad,
              minimo,
              costo,
            }),
          }
        );

      const datos =
        await respuesta.json();


      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
          "No se pudo guardar."
        );
      }


      setItems((actuales) => [
        datos,
        ...actuales,
      ]);


      limpiarFormulario();
      setMostrarFormulario(false);


    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al guardar."
      );

    } finally {
      setGuardando(false);
    }
  }


  function formatoMoneda(
    valor: string | number | null
  ) {
    return Number(
      valor ?? 0
    ).toLocaleString(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
      }
    );
  }


  function stockBajo(
    item: InventarioItem
  ) {
    if (!item.minimo) {
      return false;
    }

    return (
      Number(item.cantidad) <=
      Number(item.minimo)
    );
  }
  const totalMateriales = items.length;

  const materialesStockBajo = items.filter(
    (item) => stockBajo(item)
  ).length;

  const valorInventario = items.reduce(
    (total, item) =>
      total +
      Number(item.cantidad ?? 0) *
      Number(item.costo ?? 0),
    0
  );

  return (
  <main className="min-h-screen bg-muted/40 p-4 md:p-6">
    <div className="mx-auto max-w-7xl space-y-6">

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Administración
          </p>

          <h1 className="text-3xl font-bold">
            Inventario
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Controla materiales, existencias y movimientos del estudio.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <Link
            href="/inventario/movimientos"
            className="rounded-lg border bg-background px-4 py-2 font-medium transition hover:bg-muted"
          >
            Movimientos
          </Link>

          {!mostrarFormulario && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setMostrarFormulario(true);
              }}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Nuevo material
            </button>
          )}

        </div>
      </header>


      {/* RESUMEN DEL INVENTARIO */}
      <section className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Total de materiales
          </p>

          <p className="mt-2 text-3xl font-bold">
            {totalMateriales}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Materiales registrados
          </p>
        </div>


        <div className="rounded-xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Stock bajo
          </p>

          <p className="mt-2 text-3xl font-bold">
            {materialesStockBajo}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Requieren atención
          </p>
        </div>


        <div className="rounded-xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Valor estimado
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatoMoneda(valorInventario)}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Valor actual del inventario
          </p>
        </div>

      </section>


      {mostrarFormulario && (
        <section className="rounded-xl border bg-background p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Registrar material
          </h2>


          <form
            onSubmit={crearItem}
            className="space-y-5"
          >

            <div className="grid gap-4 md:grid-cols-2">

              <input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
                required
              />


              <input
                placeholder="Categoría"
                value={categoria}
                onChange={(e) =>
                  setCategoria(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
              />


              <input
                type="number"
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) =>
                  setCantidad(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
                required
              />


              <input
                placeholder="Unidad (ml, piezas, cajas)"
                value={unidad}
                onChange={(e) =>
                  setUnidad(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
              />


              <input
                type="number"
                placeholder="Stock mínimo"
                value={minimo}
                onChange={(e) =>
                  setMinimo(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
              />


              <input
                type="number"
                placeholder="Costo"
                value={costo}
                onChange={(e) =>
                  setCosto(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
              />

            </div>


            <textarea
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) =>
                setDescripcion(e.target.value)
              }
              className="w-full rounded-lg border px-3 py-2"
            />


            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-red-700">
                {error}
              </div>
            )}


            <div className="flex justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  limpiarFormulario();
                  setMostrarFormulario(false);
                }}
                className="rounded-lg border px-4 py-2"
              >
                Cancelar
              </button>


              <button
                disabled={guardando}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar material"}
              </button>

            </div>

          </form>

        </section>
      )}



      <section className="rounded-xl border bg-background">
        {cargando ? (
          <div className="p-4 md:p-6">
            Cargando inventario...
          </div>

        ) : items.length === 0 ? (

          <div className="p-4 text-muted-foreground md:p-6">
            No hay materiales registrados.
          </div>

        ) : (

          <>
            {/* VISTA MOVIL */}
            <div className="space-y-3 p-3 md:hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {item.nombre}
                      </h3>

                      {item.categoria && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.categoria}
                        </p>
                      )}
                    </div>

                    {stockBajo(item) ? (
                      <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs">
                        Stock bajo
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Disponible
                      </span>
                    )}
                  </div>

                  {item.descripcion && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item.descripcion}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Cantidad
                      </p>
                      <p className="mt-1 font-semibold">
                        {Number(item.cantidad)} {item.unidad || ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Costo
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatoMoneda(item.costo)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* VISTA ESCRITORIO */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm">
                    <th className="px-5 py-3">
                      Material
                    </th>

                    <th className="px-5 py-3">
                      Categoría
                    </th>

                    <th className="px-5 py-3">
                      Cantidad
                    </th>

                    <th className="px-5 py-3">
                      Costo
                    </th>

                    <th className="px-5 py-3">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {item.nombre}
                        </p>

                        {item.descripcion && (
                          <p className="text-sm text-muted-foreground">
                            {item.descripcion}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {item.categoria || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {Number(item.cantidad)}{" "}
                        {item.unidad || ""}
                      </td>

                      <td className="px-5 py-4">
                        {formatoMoneda(item.costo)}
                      </td>

                      <td className="px-5 py-4">
                        {stockBajo(item) ? (
                          <span className="rounded-full border px-3 py-1 text-sm">
                            Stock bajo
                          </span>
                        ) : (
                          <span className="text-sm">
                            Disponible
                          </span>
                        )}
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
