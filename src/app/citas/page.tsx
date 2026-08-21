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

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function cargarCitas() {
    try {
      setCargando(true);

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
          : "Error al cargar citas."
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
          : "Error al actualizar."
      );
    } finally {
      setActualizando(null);
    }
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm text-muted-foreground">
            Agenda del estudio
          </p>

          <h1 className="text-3xl font-bold">
            Citas
          </h1>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
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
              className="space-y-4 border-b p-6 last:border-0"
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <h2 className="font-semibold">
                    {cita.cliente.nombre}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      cita.fecha
                    ).toLocaleString("es-MX")}
                  </p>

                  <p className="text-sm">
                    Duración: {cita.duracion} minutos
                  </p>

                  {cita.motivo && (
                    <p className="text-sm">
                      {cita.motivo}
                    </p>
                  )}
                </div>

                <div className="font-medium">
                  {cita.estado}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {estados.map((estado) => (
                  <button
                    key={estado}
                    type="button"
                    disabled={actualizando === cita.id}
                    onClick={() =>
                      cambiarEstado(cita.id, estado)
                    }
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      cita.estado === estado
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
