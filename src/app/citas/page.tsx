"use client";

import { FormEvent, useEffect, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
};

type Cita = {
  id: number;
  fecha: string;
  duracion: number;
  motivo: string | null;
  notas: string | null;
  estado: string;
  cliente: Cliente;
  usuario: {
    id: number;
    nombre: string;
  } | null;
};

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [duracion, setDuracion] = useState("120");
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);

      const [resCitas, resClientes] = await Promise.all([
        fetch("/api/citas"),
        fetch("/api/clientes/select"),
      ]);

      const datosCitas = await resCitas.json();
      const datosClientes = await resClientes.json();

      if (!resCitas.ok || !resClientes.ok) {
        throw new Error("No se pudieron cargar los datos.");
      }

      setCitas(datosCitas);
      setClientes(datosClientes);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar datos."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function limpiarFormulario() {
    setClienteId("");
    setFecha("");
    setDuracion("120");
    setMotivo("");
    setNotas("");
  }

  async function crearCita(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch("/api/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId,
          fecha,
          duracion,
          motivo,
          notas,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error || "No se pudo crear la cita."
        );
        return;
      }

      setCitas((actuales) => [
        ...actuales,
        datos,
      ].sort(
        (a, b) =>
          new Date(a.fecha).getTime() -
          new Date(b.fecha).getTime()
      ));

      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);
      setError("Error al crear la cita.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Agenda del estudio
            </p>

            <h1 className="text-3xl font-bold">
              Citas
            </h1>
          </div>

          {!mostrarFormulario && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setMostrarFormulario(true);
              }}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Nueva cita
            </button>
          )}
        </header>

        {mostrarFormulario && (
          <section className="rounded-xl border bg-background p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Nueva cita
            </h2>

            <form
              onSubmit={crearCita}
              className="space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Cliente
                  </label>

                  <select
                    value={clienteId}
                    onChange={(e) =>
                      setClienteId(e.target.value)
                    }
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="">
                      Selecciona un cliente
                    </option>

                    {clientes.map((cliente) => (
                      <option
                        key={cliente.id}
                        value={cliente.id}
                      >
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fecha y hora
                  </label>

                  <input
                    type="datetime-local"
                    value={fecha}
                    onChange={(e) =>
                      setFecha(e.target.value)
                    }
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Duración (minutos)
                  </label>

                  <input
                    type="number"
                    value={duracion}
                    onChange={(e) =>
                      setDuracion(e.target.value)
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Motivo
                  </label>

                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) =>
                      setMotivo(e.target.value)
                    }
                    placeholder="Ej. Diseño de tatuaje"
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Notas
                </label>

                <textarea
                  value={notas}
                  onChange={(e) =>
                    setNotas(e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="rounded-lg border px-4 py-2"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar cita"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-xl border bg-background">
          {cargando && (
            <div className="p-6">
              Cargando citas...
            </div>
          )}

          {!cargando && citas.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">
              No hay citas registradas.
            </div>
          )}

          {citas.map((cita) => (
            <div
              key={cita.id}
              className="border-b p-6 last:border-0"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    {cita.cliente.nombre}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      cita.fecha
                    ).toLocaleString("es-MX")}
                  </p>
                </div>

                <span className="rounded-full border px-3 py-1 text-sm">
                  {cita.estado}
                </span>
              </div>

              {cita.motivo && (
                <p className="mt-3 text-sm">
                  {cita.motivo}
                </p>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
