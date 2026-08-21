"use client";

import { FormEvent, useEffect, useState } from "react";

type Gasto = {
  id: number;
  concepto: string;
  descripcion: string | null;
  monto: string | number;
  fecha: string;
  categoria: string;
  notas: string | null;
  usuario: {
    id: number;
    nombre: string;
  } | null;
};

const categorias = [
  {
    value: "MATERIAL",
    label: "Material",
  },
  {
    value: "EQUIPO",
    label: "Equipo",
  },
  {
    value: "RENTA",
    label: "Renta",
  },
  {
    value: "SERVICIOS",
    label: "Servicios",
  },
  {
    value: "MARKETING",
    label: "Marketing",
  },
  {
    value: "OTRO",
    label: "Otro",
  },
];

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [concepto, setConcepto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] =
    useState("MATERIAL");
  const [notas, setNotas] = useState("");

  async function cargarGastos() {
    try {
      setCargando(true);

      const respuesta = await fetch("/api/gastos");

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudieron cargar los gastos."
        );
      }

      setGastos(datos);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar gastos."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarGastos();
  }, []);

  function limpiarFormulario() {
    setConcepto("");
    setDescripcion("");
    setMonto("");
    setCategoria("MATERIAL");
    setNotas("");
  }

  async function crearGasto(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch(
        "/api/gastos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            concepto,
            descripcion,
            monto,
            categoria,
            notas,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo crear el gasto."
        );
      }

      setGastos((actuales) => [
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
          : "Error al guardar gasto."
      );
    } finally {
      setGuardando(false);
    }
  }

  const totalGastos = gastos.reduce(
    (total, gasto) =>
      total + Number(gasto.monto),
    0
  );

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Administración
            </p>

            <h1 className="text-3xl font-bold">
              Gastos
            </h1>
          </div>

          <button
            onClick={() =>
              setMostrarFormulario(true)
            }
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          >
            Nuevo gasto
          </button>
        </header>

        <section className="rounded-xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Total de gastos registrados
          </p>

          <p className="text-3xl font-bold">
            $
            {totalGastos.toLocaleString(
              "es-MX",
              {
                minimumFractionDigits: 2,
              }
            )}
          </p>
        </section>

        {mostrarFormulario && (
          <section className="rounded-xl border bg-background p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Registrar gasto
            </h2>

            <form
              onSubmit={crearGasto}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  placeholder="Concepto"
                  value={concepto}
                  onChange={(e) =>
                    setConcepto(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                  required
                />

                <input
                  type="number"
                  placeholder="Monto"
                  value={monto}
                  onChange={(e) =>
                    setMonto(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                  required
                />

                <select
                  value={categoria}
                  onChange={(e) =>
                    setCategoria(
                      e.target.value
                    )
                  }
                  className="rounded-lg border px-3 py-2"
                >
                  {categorias.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              />

              <textarea
                placeholder="Notas"
                value={notas}
                onChange={(e) =>
                  setNotas(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              />

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-red-700">
                  {error}
                </div>
              )}

              <button
                disabled={guardando}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar gasto"}
              </button>
            </form>
          </section>
        )}

        <section className="rounded-xl border bg-background">
          {cargando ? (
            <div className="p-6">
              Cargando gastos...
            </div>
          ) : gastos.length === 0 ? (
            <div className="p-6 text-muted-foreground">
              No hay gastos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-5 py-3">
                      Concepto
                    </th>

                    <th className="px-5 py-3">
                      Categoría
                    </th>

                    <th className="px-5 py-3">
                      Fecha
                    </th>

                    <th className="px-5 py-3">
                      Monto
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {gastos.map((gasto) => (
                    <tr
                      key={gasto.id}
                      className="border-b"
                    >
                      <td className="px-5 py-3">
                        {gasto.concepto}
                      </td>

                      <td className="px-5 py-3">
                        {gasto.categoria}
                      </td>

                      <td className="px-5 py-3">
                        {new Date(
                          gasto.fecha
                        ).toLocaleDateString(
                          "es-MX"
                        )}
                      </td>

                      <td className="px-5 py-3 font-semibold">
                        $
                        {Number(
                          gasto.monto
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
