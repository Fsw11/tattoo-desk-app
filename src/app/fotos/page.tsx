"use client";

import { FormEvent, useEffect, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
};

type Tatuaje = {
  id: number;
  nombre: string;
  clienteId: number;
};

type Foto = {
  id: number;
  url: string;
  descripcion: string | null;
  tipo: string;
  creadoEn: string;
  cliente: Cliente;
  tatuaje: {
    id: number;
    nombre: string;
  } | null;
};

const tiposFoto = [
  {
    valor: "TATUAJE",
    nombre: "Tatuaje",
  },
  {
    valor: "ANTES",
    nombre: "Antes",
  },
  {
    valor: "DESPUES",
    nombre: "Después",
  },
  {
    valor: "DISENO",
    nombre: "Diseño",
  },
  {
    valor: "OTRA",
    nombre: "Otra",
  },
];

export default function FotosPage() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tatuajes, setTatuajes] = useState<Tatuaje[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);
  const [error, setError] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [tatuajeId, setTatuajeId] = useState("");
  const [url, setUrl] = useState("");
  const [tipo, setTipo] = useState("TATUAJE");
  const [descripcion, setDescripcion] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [respuestaFotos, respuestaClientes] =
        await Promise.all([
          fetch("/api/fotos"),
          fetch("/api/clientes"),
        ]);

      const datosFotos =
        await respuestaFotos.json();

      const datosClientes =
        await respuestaClientes.json();

      if (!respuestaFotos.ok) {
        throw new Error(
          datosFotos.error ||
            "No se pudieron cargar las fotos."
        );
      }

      if (!respuestaClientes.ok) {
        throw new Error(
          datosClientes.error ||
            "No se pudieron cargar los clientes."
        );
      }

      setFotos(datosFotos);

      setClientes(
        datosClientes.map(
          (cliente: {
            id: number;
            nombre: string;
            tatuajes?: {
              id: number;
              nombre: string;
            }[];
          }) => ({
            id: cliente.id,
            nombre: cliente.nombre,
          })
        )
      );

      const tatuajesDisponibles: Tatuaje[] = [];

      datosClientes.forEach(
        (cliente: {
          id: number;
          tatuajes?: {
            id: number;
            nombre: string;
          }[];
        }) => {
          cliente.tatuajes?.forEach(
            (tatuaje) => {
              tatuajesDisponibles.push({
                id: tatuaje.id,
                nombre: tatuaje.nombre,
                clienteId: cliente.id,
              });
            }
          );
        }
      );

      setTatuajes(tatuajesDisponibles);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los datos."
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
    setTatuajeId("");
    setUrl("");
    setTipo("TATUAJE");
    setDescripcion("");
    setError("");
  }

  function cancelarFormulario() {
    limpiarFormulario();
    setMostrarFormulario(false);
  }

  const tatuajesFiltrados = tatuajes.filter(
    (tatuaje) =>
      !clienteId ||
      tatuaje.clienteId === Number(clienteId)
  );

  async function crearFoto(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!clienteId) {
      setError("Selecciona un cliente.");
      return;
    }

    if (!url.trim()) {
      setError("La URL de la imagen es obligatoria.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch(
        "/api/fotos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clienteId: Number(clienteId),
            tatuajeId: tatuajeId
              ? Number(tatuajeId)
              : null,
            url: url.trim(),
            tipo,
            descripcion:
              descripcion.trim() || null,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            "No se pudo registrar la foto."
        );
        return;
      }

      await cargarDatos();

      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al registrar la foto."
      );
    } finally {
      setGuardando(false);
    }
  }

  function nombreTipo(tipoFoto: string) {
    return (
      tiposFoto.find(
        (tipoActual) =>
          tipoActual.valor === tipoFoto
      )?.nombre || tipoFoto
    );
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
              Fotos
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Diseños, fotos de antes, después y trabajos
              realizados.
            </p>
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
              Nueva foto
            </button>
          )}
        </header>

        {mostrarFormulario && (
          <section className="rounded-xl border bg-background p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Registrar foto
              </h2>

              <p className="text-sm text-muted-foreground">
                Guarda la referencia de una imagen asociada
                al cliente o a un tatuaje.
              </p>
            </div>

            <form
              onSubmit={crearFoto}
              className="space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="cliente"
                    className="text-sm font-medium"
                  >
                    Cliente *
                  </label>

                  <select
                    id="cliente"
                    value={clienteId}
                    onChange={(event) => {
                      setClienteId(
                        event.target.value
                      );
                      setTatuajeId("");
                    }}
                    className="w-full rounded-lg border bg-background px-3 py-2"
                    required
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
                  <label
                    htmlFor="tatuaje"
                    className="text-sm font-medium"
                  >
                    Tatuaje
                  </label>

                  <select
                    id="tatuaje"
                    value={tatuajeId}
                    onChange={(event) =>
                      setTatuajeId(
                        event.target.value
                      )
                    }
                    disabled={!clienteId}
                    className="w-full rounded-lg border bg-background px-3 py-2 disabled:opacity-50"
                  >
                    <option value="">
                      Foto general del cliente
                    </option>

                    {tatuajesFiltrados.map(
                      (tatuaje) => (
                        <option
                          key={tatuaje.id}
                          value={tatuaje.id}
                        >
                          {tatuaje.nombre}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="tipo"
                    className="text-sm font-medium"
                  >
                    Tipo de foto *
                  </label>

                  <select
                    id="tipo"
                    value={tipo}
                    onChange={(event) =>
                      setTipo(event.target.value)
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    {tiposFoto.map(
                      (tipoActual) => (
                        <option
                          key={tipoActual.valor}
                          value={tipoActual.valor}
                        >
                          {tipoActual.nombre}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="url"
                    className="text-sm font-medium"
                  >
                    URL de imagen *
                  </label>

                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(event) =>
                      setUrl(event.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border bg-background px-3 py-2"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="descripcion"
                    className="text-sm font-medium"
                  >
                    Descripción
                  </label>

                  <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(event) =>
                      setDescripcion(
                        event.target.value
                      )
                    }
                    placeholder="Descripción de la imagen..."
                    rows={3}
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>
              </div>

              {url.trim() && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Vista previa
                  </p>

                  <div className="max-w-sm overflow-hidden rounded-lg border">
                    <img
                      src={url}
                      alt="Vista previa"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                </div>
              )}

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
                  {guardando
                    ? "Guardando..."
                    : "Guardar foto"}
                </button>
              </div>
            </form>
          </section>
        )}

        {error && !mostrarFormulario && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border bg-background">
          {cargando ? (
            <div className="p-6 text-sm text-muted-foreground">
              Cargando fotos...
            </div>
          ) : fotos.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No hay fotos registradas.
            </div>
          ) : (
            <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fotos.map((foto) => (
                <article
                  key={foto.id}
                  className="overflow-hidden rounded-xl border bg-background"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={foto.url}
                      alt={
                        foto.descripcion ||
                        "Foto del tatuaje"
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border px-2 py-1 text-xs font-medium">
                        {nombreTipo(foto.tipo)}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          foto.creadoEn
                        ).toLocaleDateString(
                          "es-MX"
                        )}
                      </span>
                    </div>

                    <h3 className="font-semibold">
                      {foto.cliente.nombre}
                    </h3>

                    {foto.tatuaje && (
                      <p className="text-sm text-muted-foreground">
                        Tatuaje:{" "}
                        {foto.tatuaje.nombre}
                      </p>
                    )}

                    {foto.descripcion && (
                      <p className="text-sm text-muted-foreground">
                        {foto.descripcion}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
