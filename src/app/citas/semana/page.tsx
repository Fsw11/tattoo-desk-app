"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatoDia,
  inicioDeSemana,
  sumarDias,
} from "@/lib/agenda-core";

type Cita = {
  id: string;
  fecha: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  cliente: {
    id: string;
    nombre: string;
    telefono: string;
  };
  usuario: {
    id: number;
    nombre: string;
  } | null;
};

function claseEstado(estado: string) {
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

function hora(fecha: string) {
  return new Date(fecha).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SemanaPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [semana, setSemana] = useState(
    inicioDeSemana(new Date())
  );

  useEffect(() => {
    async function cargar() {
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

    cargar();
  }, []);

  const dias = useMemo(
    () =>
      Array.from({ length: 7 }, (_, indice) =>
        sumarDias(semana, indice)
      ),
    [semana]
  );

  function citasDelDia(dia: Date) {
    return citas.filter((cita) => {
      const fecha = new Date(cita.fecha);

      return (
        fecha.getFullYear() === dia.getFullYear() &&
        fecha.getMonth() === dia.getMonth() &&
        fecha.getDate() === dia.getDate()
      );
    });
  }

  function semanaAnterior() {
    setSemana((actual) => sumarDias(actual, -7));
  }

  function semanaSiguiente() {
    setSemana((actual) => sumarDias(actual, 7));
  }

  function semanaActual() {
    setSemana(inicioDeSemana(new Date()));
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Agenda semanal
            </p>

            <h1 className="text-3xl font-bold">
              Semana
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Consulta las citas organizadas de lunes a domingo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/citas"
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Agenda diaria
            </Link>

            <button
              type="button"
              onClick={semanaAnterior}
              className="rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              ← Anterior
            </button>

            <button
              type="button"
              onClick={semanaActual}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={semanaSiguiente}
              className="rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              Siguiente →
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando ? (
          <section className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
            Cargando agenda...
          </section>
        ) : (
          <section className="overflow-x-auto rounded-xl border bg-background">
            <div className="grid min-w-[1050px] grid-cols-7">
              {dias.map((dia) => {
                const citas = citasDelDia(dia);

                return (
                  <div
                    key={dia.toISOString()}
                    className="min-h-[500px] border-r last:border-r-0"
                  >
                    <div className="border-b bg-muted/40 p-4 text-center">
                      <p className="text-sm font-semibold capitalize">
                        {formatoDia(dia)}
                      </p>
                    </div>

                    <div className="space-y-3 p-3">
                      {citas.length === 0 ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">
                          Sin citas
                        </p>
                      ) : (
                        citas.map((cita) => (
                          <article
                            key={cita.id}
                            className={`rounded-lg border p-3 ${claseEstado(
                              cita.estado
                            )}`}
                          >
                            <p className="text-sm font-bold">
                              {hora(cita.fecha)}
                            </p>

                            <p className="mt-1 font-semibold">
                              {cita.cliente.nombre}
                            </p>

                            <p className="text-xs">
                              {cita.duracion} min
                            </p>

                            {cita.motivo && (
                              <p className="mt-2 text-xs">
                                {cita.motivo}
                              </p>
                            )}

                            {cita.usuario && (
                              <p className="mt-2 text-[11px]">
                                {cita.usuario.nombre}
                              </p>
                            )}

                            <p className="mt-2 text-[11px] font-medium">
                              {cita.estado}
                            </p>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
