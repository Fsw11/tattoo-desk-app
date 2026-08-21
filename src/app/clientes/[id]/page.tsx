"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email: string | null;
  instagram: string | null;
  direccion: string | null;
  alergias: string | null;
  enfermedades: string | null;
  notas: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export default function ClientePage() {
  const params = useParams();
  const id = params.id;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCliente() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(`/api/clientes/${id}`);

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.error || "No se pudo cargar el cliente."
          );
        }

        setCliente(datos);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el cliente."
        );
      } finally {
        setCargando(false);
      }
    }

    if (id) {
      cargarCliente();
    }
  }, [id]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-muted/40 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border bg-background p-6">
            Cargando cliente...
          </div>
        </div>
      </main>
    );
  }

  if (error || !cliente) {
    return (
      <main className="min-h-screen bg-muted/40 p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <Link
            href="/clientes"
            className="text-sm font-medium underline"
          >
            ← Volver a clientes
          </Link>

          <div className="rounded-xl border bg-background p-6">
            <p className="text-red-600">
              {error || "Cliente no encontrado."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href="/clientes"
            className="text-sm font-medium underline"
          >
            ← Volver a clientes
          </Link>
        </div>

        <header className="flex flex-col gap-4 rounded-xl border bg-background p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Ficha del cliente
            </p>

            <h1 className="text-3xl font-bold">
              {cliente.nombre}
            </h1>
          </div>

          <button
            type="button"
            className="rounded-lg border px-4 py-2 font-medium"
          >
            Editar cliente
          </button>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-background p-6">
            <h2 className="mb-5 text-lg font-semibold">
              Datos de contacto
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Teléfono
                </p>
                <p className="font-medium">
                  {cliente.telefono}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Correo electrónico
                </p>
                <p className="font-medium">
                  {cliente.email || "No registrado"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Instagram
                </p>
                <p className="font-medium">
                  {cliente.instagram || "No registrado"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Dirección
                </p>
                <p className="font-medium">
                  {cliente.direccion || "No registrada"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-6">
            <h2 className="mb-5 text-lg font-semibold">
              Información importante
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Alergias
                </p>
                <p className="whitespace-pre-wrap font-medium">
                  {cliente.alergias || "Ninguna registrada"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Enfermedades
                </p>
                <p className="whitespace-pre-wrap font-medium">
                  {cliente.enfermedades || "Ninguna registrada"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Notas
                </p>
                <p className="whitespace-pre-wrap font-medium">
                  {cliente.notas || "Sin notas"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-5 text-lg font-semibold">
            Historial
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Citas
              </p>
              <p className="mt-1 text-2xl font-bold">
                Próximamente
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Tatuajes
              </p>
              <p className="mt-1 text-2xl font-bold">
                Próximamente
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Pagos
              </p>
              <p className="mt-1 text-2xl font-bold">
                Próximamente
              </p>
            </div>
          </div>
        </section>

        <p className="text-sm text-muted-foreground">
          Cliente registrado el{" "}
          {new Date(cliente.creadoEn).toLocaleDateString("es-MX")}
        </p>
      </div>
    </main>
  );
}
