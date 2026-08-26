"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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

  citas: {
    id: number;
    fecha: string;
    duracion: number;
    motivo: string | null;
    notas: string | null;
    estado: string;
  }[];

  tatuajes: {
    id: number;
    nombre: string;
    descripcion: string | null;
    estilo: string | null;
    zona: string | null;
    precio: string | number | null;
    anticipo: string | number | null;
    estado: string;
    notas: string | null;
    creadoEn: string;
  }[];

  pagos: {
    id: number;
    monto: string | number;
    concepto: string | null;
    notas: string | null;
    metodo: string;
    fecha: string;
    tatuajeId: number | null;
  }[];
};

export default function ClientePage() {
  const params = useParams();
  const id = params.id;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [direccion, setDireccion] = useState("");
  const [alergias, setAlergias] = useState("");
  const [enfermedades, setEnfermedades] = useState("");
  const [notas, setNotas] = useState("");

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
      cargarFormulario(datos);
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

  function cargarFormulario(datos: Cliente) {
    setNombre(datos.nombre);
    setTelefono(datos.telefono);
    setEmail(datos.email || "");
    setInstagram(datos.instagram || "");
    setDireccion(datos.direccion || "");
    setAlergias(datos.alergias || "");
    setEnfermedades(datos.enfermedades || "");
    setNotas(datos.notas || "");
  }

  useEffect(() => {
    if (id) {
      cargarCliente();
    }
  }, [id]);

  function cancelarEdicion() {
    if (cliente) {
      cargarFormulario(cliente);
    }

    setError("");
    setEditando(false);
  }

  async function guardarCambios(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nombre.trim() || !telefono.trim()) {
      setError("El nombre y el teléfono son obligatorios.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          telefono,
          email,
          instagram,
          direccion,
          alergias,
          enfermedades,
          notas,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error || "No se pudo actualizar el cliente."
        );
        return;
      }

      setCliente(datos);
      cargarFormulario(datos);
      setEditando(false);
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al actualizar el cliente.");
    } finally {
      setGuardando(false);
    }
  }

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

  if (error && !cliente) {
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
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!cliente) {
    return null;
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/clientes"
          className="text-sm font-medium underline"
        >
          ← Volver a clientes
        </Link>

        <header className="flex flex-col gap-4 rounded-xl border bg-background p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Ficha del cliente
            </p>

            <h1 className="text-3xl font-bold">
              {cliente.nombre}
            </h1>
          </div>

          {!editando && (
            <button
              type="button"
              onClick={() => {
                setError("");
                cargarFormulario(cliente);
                setEditando(true);
              }}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Editar cliente
            </button>
          )}
        </header>

        {editando ? (
          <form
            onSubmit={guardarCambios}
            className="space-y-6"
          >
            <section className="rounded-xl border bg-background p-6">
              <h2 className="mb-5 text-lg font-semibold">
                Datos del cliente
              </h2>

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
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="direccion"
                    className="text-sm font-medium"
                  >
                    Dirección
                  </label>

                  <input
                    id="direccion"
                    type="text"
                    value={direccion}
                    onChange={(event) =>
                      setDireccion(event.target.value)
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-background p-6">
              <h2 className="mb-5 text-lg font-semibold">
                Información importante
              </h2>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="alergias"
                    className="text-sm font-medium"
                  >
                    Alergias
                  </label>

                  <textarea
                    id="alergias"
                    value={alergias}
                    onChange={(event) =>
                      setAlergias(event.target.value)
                    }
                    rows={3}
                    placeholder="Alergias conocidas..."
                    className="w-full resize-y rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="enfermedades"
                    className="text-sm font-medium"
                  >
                    Enfermedades
                  </label>

                  <textarea
                    id="enfermedades"
                    value={enfermedades}
                    onChange={(event) =>
                      setEnfermedades(event.target.value)
                    }
                    rows={3}
                    placeholder="Información médica relevante..."
                    className="w-full resize-y rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="notas"
                    className="text-sm font-medium"
                  >
                    Notas
                  </label>

                  <textarea
                    id="notas"
                    value={notas}
                    onChange={(event) =>
                      setNotas(event.target.value)
                    }
                    rows={4}
                    placeholder="Notas adicionales del cliente..."
                    className="w-full resize-y rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={guardando}
                className="rounded-lg border px-4 py-2 font-medium disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : (
          <>
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
                      {cliente.enfermedades ||
                        "Ninguna registrada"}
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
                    {cliente.citas.length}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Tatuajes
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {cliente.tatuajes.length}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Pagos
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {cliente.pagos.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold">
                    Últimas citas
                  </h3>

                  {cliente.citas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay citas registradas.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cliente.citas.slice(0, 5).map((cita) => (
                        <div
                          key={cita.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-medium">
                              {new Date(cita.fecha).toLocaleString(
                                "es-MX",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              )}
                            </p>

                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              {cita.estado}
                            </span>
                          </div>

                          {cita.motivo && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {cita.motivo}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">
                    Tatuajes
                  </h3>

                  {cliente.tatuajes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay tatuajes registrados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cliente.tatuajes.slice(0, 5).map((tatuaje) => (
                        <div
                          key={tatuaje.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-medium">
                              {tatuaje.nombre}
                            </p>

                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              {tatuaje.estado}
                            </span>
                          </div>

                          {(tatuaje.zona || tatuaje.estilo) && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {[tatuaje.zona, tatuaje.estilo]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">
                    Últimos pagos
                  </h3>

                  {cliente.pagos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay pagos registrados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cliente.pagos.slice(0, 5).map((pago) => (
                        <div
                          key={pago.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-medium">
                              ${Number(pago.monto).toFixed(2)}
                            </p>

                            <span className="text-xs text-muted-foreground">
                              {new Date(pago.fecha).toLocaleDateString(
                                "es-MX"
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {pago.concepto || pago.metodo}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <p className="text-sm text-muted-foreground">
              Cliente registrado el{" "}
              {new Date(cliente.creadoEn).toLocaleDateString(
                "es-MX"
              )}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
