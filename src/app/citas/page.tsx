"use client";

import { useEffect, useState } from "react";

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

const estados = [
  "PENDIENTE",
  "CONFIRMADA",
  "FINALIZADA",
  "CANCELADA",
];

function obtenerClaseEstado(estado: string) {
  switch (estado) {
    case "CONFIRMADA":
      return "border-green-200 bg-green-50 text-green-700";

    case "FINALIZADA":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "CANCELADA":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }
}

function formatearHora(fecha: string) {
  return new Date(fecha).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function cargarCitas() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch("/api/citas");
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudieron cargar las citas."
        );
      }

      setCitas(datos);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar las citas."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCitas();
  }, []);

  async function cambiarEstado(
    citaId: number,
    estado: string
  ) {
    try {
      setActualizando(citaId);
      setError("");

      const respuesta = await fetch(
        `/api/citas/${citaId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo actualizar la cita."
        );
      }

      setCitas((actuales) =>
        actuales.map((cita) =>
          cita.id === citaId
            ? {
                ...cita,
                estado: datos.estado,
              }
            : cita
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al actualizar la cita."
      );
    } finally {
      setActualizando(null);
    }
  }

  const citasPorFecha = citas.reduce<
    Record<string, Cita[]>
  >((grupos, cita) => {
    const fecha = new Date(cita.fecha).toLocaleDateString(
      "es-MX"
    );

    if (!grupos[fecha]) {
      grupos[fecha] = [];
    }

    grupos[fecha].push(cita);

    return grupos;
  }, {});

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm text-muted-foreground">
            Agenda del estudio
          </p>

          <h1 className="text-3xl font-bold">
            Citas
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Consulta y administra las citas de tus clientes.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando && (
          <section className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
            Cargando agenda...
          </section>
        )}

        {!cargando && citas.length === 0 && (
          <section className="rounded-xl border bg-background p-10 text-center">
            <h2 className="text-lg font-semibold">
              No hay citas
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Las citas que registres aparecerán aquí.
            </p>
          </section>
        )}

        {!cargando &&
          Object.entries(citasPorFecha).map(
            ([fecha, citasDelDia]) => (
              <section
                key={fecha}
                className="space-y-3"
              >
                <div>
                  <h2 className="text-lg font-semibold capitalize">
                    {formatearFecha(citasDelDia[0].fecha)}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {citasDelDia.length}{" "}
                    {citasDelDia.length === 1
                      ? "cita"
                      : "citas"}
                  </p>
                </div>

                <div className="space-y-3">
                  {citasDelDia.map((cita) => (
                    <article
                      key={cita.id}
                      className="rounded-xl border bg-background p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-4">
                          <div className="min-w-20 rounded-lg border bg-muted/40 p-3 text-center">
                            <div className="text-lg font-bold">
                              {formatearHora(cita.fecha)}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {cita.duracion} min
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold">
                              {cita.cliente.nombre}
                            </h3>

                            <p className="text-sm text-muted-foreground">
                              {cita.cliente.telefono}
                            </p>

                            {cita.motivo && (
                              <p className="mt-2 text-sm">
                                {cita.motivo}
                              </p>
                            )}

                            {cita.usuario && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Tatuador:{" "}
                                {cita.usuario.nombre}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${obtenerClaseEstado(
                            cita.estado
                          )}`}
                        >
                          {cita.estado}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                        {estados.map((estado) => (
                          <button
                            key={estado}
                            type="button"
                            disabled={
                              actualizando === cita.id ||
                              cita.estado === estado
                            }
                            onClick={() =>
                              cambiarEstado(
                                cita.id,
                                estado
                              )
                            }
                            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                              cita.estado === estado
                                ? "cursor-default bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            } disabled:opacity-60`}
                          >
                            {estado}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          )}
      </div>
    </main>
  );
}
