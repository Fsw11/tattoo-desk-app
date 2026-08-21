"use client";

import { FormEvent, useEffect, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email: string | null;
  instagram: string | null;
  creadoEn: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");

  async function cargarClientes() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch("/api/clientes");

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los clientes.");
      }

      const datos = await respuesta.json();
      setClientes(datos);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los clientes.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  function limpiarFormulario() {
    setNombre("");
    setTelefono("");
    setEmail("");
    setInstagram("");
    setError("");
  }

  function cancelarFormulario() {
    limpiarFormulario();
    setMostrarFormulario(false);
  }

  async function crearCliente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nombre.trim() || !telefono.trim()) {
      setError("El nombre y el teléfono son obligatorios.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          telefono,
          email,
          instagram,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "No se pudo crear el cliente.");
        return;
      }

      setClientes((clientesActuales) => [
        datos,
        ...clientesActuales,
      ]);

      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al crear el cliente.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Gestión del estudio
            </p>

            <h1 className="text-3xl font-bold">
              Clientes
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
              Nuevo cliente
            </button>
          )}
        </header>

        {mostrarFormulario && (
          <section className="rounded-xl border bg-background p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Nuevo cliente
              </h2>

              <p className="text-sm text-muted-foreground">
                Registra los datos básicos del cliente.
              </p>
            </div>

            <form
              onSubmit={crearCliente}
              className="space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="nombre"
                    className="text-sm font-medium"
                  >
                    Nombre *
                  </label>

                  <input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(event) =>
                      setNombre(event.target.value)
                    }
                    placeholder="Nombre completo"
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="telefono"
                    className="text-sm font-medium"
                  >
                    Teléfono *
                  </label>

                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(event) =>
                      setTelefono(event.target.value)
                    }
                    placeholder="6861234567"
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium"
                  >
                    Correo electrónico
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="cliente@correo.com"
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="instagram"
                    className="text-sm font-medium"
                  >
                    Instagram
                  </label>

                  <input
                    id="instagram"
                    type="text"
                    value={instagram}
                    onChange={(event) =>
                      setInstagram(event.target.value)
                    }
                    placeholder="@usuario"
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelarFormulario}
                  disabled={guardando}
                  className="rounded-lg border px-4 py-2 font-medium"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar cliente"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-xl border bg-background">
          {cargando && (
            <div className="p-6 text-sm text-muted-foreground">
              Cargando clientes...
            </div>
          )}

          {!cargando && error && !mostrarFormulario && (
            <div className="p-6 text-sm text-red-600">
              {error}
            </div>
          )}

          {!cargando && !error && clientes.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">
              No hay clientes registrados.
            </div>
          )}

          {!cargando && clientes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm">
                    <th className="px-6 py-4 font-medium">
                      Nombre
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Teléfono
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Correo
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Instagram
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Registro
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        {cliente.nombre}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.telefono}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.email || "—"}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.instagram || "—"}
                      </td>

                      <td className="px-6 py-4">
                        {new Date(
                          cliente.creadoEn
                        ).toLocaleDateString("es-MX")}
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
