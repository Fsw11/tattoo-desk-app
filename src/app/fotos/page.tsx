"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

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
  cliente: {
    id: number;
    nombre: string;
  };
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
  const [fotos, setFotos] =
    useState<Foto[]>([]);

  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [tatuajes, setTatuajes] =
    useState<Tatuaje[]>([]);

  const [archivo, setArchivo] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState("");

  const [clienteId, setClienteId] =
    useState("");

  const [tatuajeId, setTatuajeId] =
    useState("");

  const [tipo, setTipo] =
    useState("TATUAJE");

  const [descripcion, setDescripcion] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fotoSeleccionada, setFotoSeleccionada] =
    useState<Foto | null>(null);

  const [filtroTipo, setFiltroTipo] =
    useState("TODAS");

  const [filtroCliente, setFiltroCliente] =
    useState("TODOS");

  const [filtroTatuaje, setFiltroTatuaje] =
    useState("TODOS");

  const [busquedaCliente, setBusquedaCliente] =
    useState("");

  async function cargarDatos() {
    try {
      setCargando(true);

      const [
        respuestaFotos,
        respuestaClientes,
      ] = await Promise.all([
        fetch("/api/fotos"),
        fetch("/api/clientes"),
      ]);

      const fotosData =
        await respuestaFotos.json();

      const clientesData =
        await respuestaClientes.json();

      setFotos(fotosData);

      setClientes(
        clientesData.map(
          (cliente: any) => ({
            id: cliente.id,
            nombre: cliente.nombre,
          })
        )
      );

      const listaTatuajes: Tatuaje[] = [];

      clientesData.forEach(
        (cliente: any) => {
          cliente.tatuajes?.forEach(
            (tatuaje: any) => {
              listaTatuajes.push({
                id: tatuaje.id,
                nombre: tatuaje.nombre,
                clienteId: cliente.id,
              });
            }
          );
        }
      );

      setTatuajes(listaTatuajes);

    } catch (error) {
      console.error(error);

      setError(
        "No se pudieron cargar los datos."
      );

    } finally {
      setCargando(false);
    }
  }

  async function eliminarFoto(fotoId: number) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar esta foto?"
    );

    if (!confirmar) {
      return;
    }

    try {
      setError("");

      const respuesta = await fetch("/api/fotos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: fotoId,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo eliminar la foto."
        );
      }

      setFotoSeleccionada(null);

      await cargarDatos();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la foto."
      );
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function seleccionarArchivo(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const nuevoArchivo =
      event.target.files?.[0];

    if (!nuevoArchivo) {
      return;
    }

    setArchivo(nuevoArchivo);

    setPreview(
      URL.createObjectURL(
        nuevoArchivo
      )
    );
  }

  const clientesFiltrados =
    clientes.filter((cliente) =>
      cliente.nombre
        .toLowerCase()
        .includes(
          busquedaCliente
            .toLowerCase()
            .trim()
        )
    );

  const tatuajesFiltrados =
    tatuajes.filter(
      (tatuaje) =>
        !clienteId ||
        tatuaje.clienteId ===
          Number(clienteId)
    );

  const tatuajesFiltro =
    filtroCliente === "TODOS"
      ? tatuajes
      : tatuajes.filter(
          (tatuaje) =>
            String(tatuaje.clienteId) === filtroCliente
        );

  const fotosFiltradas =
    fotos.filter((foto) => {
      const coincideCliente =
        filtroCliente === "TODOS" ||
        String(foto.cliente?.id) === filtroCliente;

      const coincideTipo =
        filtroTipo === "TODAS" ||
        foto.tipo === filtroTipo;

      const coincideTatuaje =
        filtroTatuaje === "TODOS" ||
        String(foto.tatuaje?.id) === filtroTatuaje;

      return (
        coincideCliente &&
        coincideTipo &&
        coincideTatuaje
      );
    });

  function fotoAnterior() {
    if (!fotoSeleccionada || fotosFiltradas.length === 0) {
      return;
    }

    const indiceActual = fotosFiltradas.findIndex(
      (foto) => foto.id === fotoSeleccionada.id
    );

    if (indiceActual === -1) {
      return;
    }

    const indiceAnterior =
      indiceActual === 0
        ? fotosFiltradas.length - 1
        : indiceActual - 1;

    setFotoSeleccionada(
      fotosFiltradas[indiceAnterior]
    );
  }

  function fotoSiguiente() {
    if (!fotoSeleccionada || fotosFiltradas.length === 0) {
      return;
    }

    const indiceActual = fotosFiltradas.findIndex(
      (foto) => foto.id === fotoSeleccionada.id
    );

    if (indiceActual === -1) {
      return;
    }

    const indiceSiguiente =
      indiceActual === fotosFiltradas.length - 1
        ? 0
        : indiceActual + 1;

    setFotoSeleccionada(
      fotosFiltradas[indiceSiguiente]
    );
  }

  const cantidadFotosPorTipo = (tipo: string) =>
    fotos.filter((foto) => {
      const coincideCliente =
        filtroCliente === "TODOS" ||
        String(foto.cliente?.id) === filtroCliente;

      return coincideCliente && foto.tipo === tipo;
    }).length;

  function limpiar() {
    setArchivo(null);
    setPreview("");
    setClienteId("");
    setTatuajeId("");
    setTipo("TATUAJE");
    setDescripcion("");
    setError("");
  }

  async function crearFoto(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!archivo) {
      setError(
        "Selecciona una imagen."
      );
      return;
    }

    if (!clienteId) {
      setError(
        "Selecciona un cliente."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const formulario =
        new FormData();

      formulario.append(
        "archivo",
        archivo
      );

      const subida =
        await fetch(
          "/api/upload",
          {
            method: "POST",
            body: formulario,
          }
        );

      const subidaData =
        await subida.json();

      if (!subida.ok) {
        throw new Error(
          subidaData.error
        );
      }

      const respuesta =
        await fetch(
          "/api/fotos",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              clienteId:
                Number(clienteId),

              tatuajeId:
                tatuajeId
                  ? Number(tatuajeId)
                  : null,

              url:
                subidaData.url,

              tipo,

              descripcion:
                descripcion ||
                null,
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error
        );
      }

      await cargarDatos();

      limpiar();

      setMostrarFormulario(false);

    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al guardar foto."
      );

    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <header className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Fotos
            </h1>

            <p className="text-sm text-muted-foreground">
              Galería del estudio
            </p>
          </div>

          <button
            onClick={() =>
              setMostrarFormulario(true)
            }
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          >
            Nueva foto
          </button>
        </header>


        {mostrarFormulario && (
          <section className="rounded-xl border bg-background p-6">

            <form
              onSubmit={crearFoto}
              className="space-y-5"
            >

              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Imagen
                </label>

                <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-6 transition hover:bg-muted">
                  <div className="text-center">
                    <div className="mb-2 text-3xl">
                      📷
                    </div>

                    <p className="font-medium">
                      Seleccionar imagen
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      PNG, JPG, JPEG o WEBP
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={seleccionarArchivo}
                    className="hidden"
                  />
                </label>

                {archivo && (
                  <div className="rounded-lg border p-3">
                    <p className="font-medium">
                      {archivo.name}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                {preview && (
                  <div className="overflow-hidden rounded-xl border">
                    <img
                      src={preview}
                      alt="Vista previa de la imagen"
                      className="max-h-80 w-full object-contain"
                    />
                  </div>
                )}
              </div>


              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Cliente
                </label>

                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={
                    clienteId
                      ? clientes.find(
                          (cliente) =>
                            String(cliente.id) === clienteId
                        )?.nombre ?? busquedaCliente
                      : busquedaCliente
                  }
                  onChange={(e) => {
                    setBusquedaCliente(e.target.value);

                    if (clienteId) {
                      setClienteId("");
                      setTatuajeId("");
                    }
                  }}
                  className="w-full rounded-lg border p-2"
                />

                {!clienteId &&
                  busquedaCliente.trim() && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border bg-background">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map((cliente) => (
                          <button
                            key={cliente.id}
                            type="button"
                            onClick={() => {
                              setClienteId(
                                String(cliente.id)
                              );
                              setBusquedaCliente(
                                cliente.nombre
                              );
                              setTatuajeId("");
                              setFiltroTatuaje("TODOS");
                            }}
                            className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted"
                          >
                            {cliente.nombre}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          No se encontraron clientes.
                        </p>
                      )}
                    </div>
                  )}

                {clienteId && (
                  <button
                    type="button"
                    onClick={() => {
                      setClienteId("");
                      setBusquedaCliente("");
                      setTatuajeId("");
                    }}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Cambiar cliente
                  </button>
                )}
              </div>


              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Tatuaje
                </label>

                <select
                  value={tatuajeId}
                  onChange={(e) =>
                    setTatuajeId(
                      e.target.value
                    )
                  }
                  disabled={!clienteId}
                  className="w-full rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    Foto general
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

                {clienteId &&
                  tatuajesFiltrados.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Este cliente no tiene tatuajes registrados.
                      Puedes guardar la foto como foto general.
                    </p>
                  )}

                {!clienteId && (
                  <p className="text-sm text-muted-foreground">
                    Selecciona primero un cliente.
                  </p>
                )}
              </div>


              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border p-2"
              >
                {tiposFoto.map(
                  (item) => (
                    <option
                      key={item.valor}
                      value={item.valor}
                    >
                      {item.nombre}
                    </option>
                  )
                )}
              </select>


              <textarea
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border p-2"
              />


              {error && (
                <p className="text-red-600">
                  {error}
                </p>
              )}


              <button
                type="submit"
                disabled={
                  guardando ||
                  !archivo ||
                  !clienteId
                }
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar foto"}
              </button>

            </form>

          </section>
        )}


        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium">
            Buscar cliente
          </label>

          <input
            type="text"
            placeholder="Escribe el nombre del cliente..."
            value={busquedaCliente}
            onChange={(e) => {
              setBusquedaCliente(e.target.value);

              if (filtroCliente !== "TODOS") {
                setFiltroCliente("TODOS");
              }
            }}
            className="w-full max-w-md rounded-lg border bg-background px-3 py-2"
          />

          <div className="mt-2 w-full max-w-md space-y-1">
            {busquedaCliente.trim() !== "" &&
              clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => {
                    setFiltroCliente(String(cliente.id));
                    setFiltroTatuaje("TODOS");
                    setBusquedaCliente(cliente.nombre);
                  }}
                  className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:bg-muted ${
                    filtroCliente === String(cliente.id)
                      ? "bg-muted font-semibold"
                      : "bg-background"
                  }`}
                >
                  {cliente.nombre}
                </button>
              ))}

            {busquedaCliente.trim() !== "" &&
              clientesFiltrados.length === 0 && (
                <p className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                  No se encontraron clientes.
                </p>
              )}
          </div>

          {filtroCliente !== "TODOS" && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">
                Filtrar por tatuaje
              </label>

              <select
                value={filtroTatuaje}
                onChange={(e) =>
                  setFiltroTatuaje(e.target.value)
                }
                className="w-full max-w-md rounded-lg border bg-background px-3 py-2"
              >
                <option value="TODOS">
                  Todos los tatuajes
                </option>

                {tatuajesFiltro.map((tatuaje) => (
                  <option
                    key={tatuaje.id}
                    value={tatuaje.id}
                  >
                    {tatuaje.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Cliente seleccionado:
            </span>

            <span className="text-sm font-medium">
              {filtroCliente === "TODOS"
                ? "Todos los clientes"
                : clientes.find(
                    (cliente) =>
                      String(cliente.id) === filtroCliente
                  )?.nombre ?? "Cliente desconocido"}
            </span>

            {filtroCliente !== "TODOS" && (
              <button
                type="button"
                onClick={() => {
                  setFiltroCliente("TODOS");
                  setFiltroTatuaje("TODOS");
                  setBusquedaCliente("");
                }}
                className="rounded-lg border px-2 py-1 text-xs hover:bg-muted"
              >
                Mostrar todos
              </button>
            )}
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { valor: "TODAS", nombre: "Todas" },
            { valor: "TATUAJE", nombre: "Tatuaje" },
            { valor: "ANTES", nombre: "Antes" },
            { valor: "DESPUES", nombre: "Después" },
            { valor: "DISENO", nombre: "Diseño" },
            { valor: "OTRA", nombre: "Otra" },
          ].map((filtro) => {
            const cantidad =
              fotos.filter((foto) => {
                const coincideCliente =
                  filtroCliente === "TODOS" ||
                  String(foto.cliente?.id) === filtroCliente;

                const coincideTatuaje =
                  filtroTatuaje === "TODOS" ||
                  String(foto.tatuaje?.id) === filtroTatuaje;

                const coincideTipo =
                  filtro.valor === "TODAS" ||
                  foto.tipo === filtro.valor;

                return (
                  coincideCliente &&
                  coincideTatuaje &&
                  coincideTipo
                );
              }).length;

            return (
              <button
                key={filtro.valor}
                type="button"
                onClick={() => setFiltroTipo(filtro.valor)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  filtroTipo === filtro.valor
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {filtro.nombre} ({cantidad})
              </button>
            );
          })}
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          {fotosFiltradas.map((foto) => (
            <article
              key={foto.id}
              className="overflow-hidden rounded-xl border bg-background shadow-sm transition hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => setFotoSeleccionada(foto)}
                className="block w-full cursor-zoom-in"
              >
                <img
                  src={foto.url}
                  alt={`Foto de ${foto.cliente?.nombre ?? "cliente"}`}
                  className="h-64 w-full object-cover transition duration-200 hover:scale-[1.02]"
                />
              </button>

              <div className="space-y-3 p-4">
                <div>
                  <p className="text-base font-semibold">
                    {foto.cliente?.nombre ?? "Cliente desconocido"}
                  </p>

                  {foto.tatuaje ? (
                    <p className="mt-1 text-sm font-medium">
                      Tatuaje: {foto.tatuaje.nombre}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Foto general
                    </p>
                  )}
                </div>

                <div>
                  <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase">
                    {foto.tipo}
                  </span>
                </div>

                {foto.descripcion && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {foto.descripcion}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => eliminarFoto(foto.id)}
                  className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Eliminar foto
                </button>
              </div>
            </article>
          ))}
        </section>

      </div>

      {fotoSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setFotoSeleccionada(null)}
        >
          <button
            type="button"
            onClick={() => setFotoSeleccionada(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white px-4 py-2 text-xl font-bold text-black shadow-lg"
            aria-label="Cerrar"
          >
            ×
          </button>

          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={fotoAnterior}
              className="absolute left-[-3.5rem] top-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-3 text-xl font-bold text-black shadow-lg hover:bg-gray-100"
              aria-label="Foto anterior"
            >
              ←
            </button>

            <img
              src={fotoSeleccionada.url}
              alt={`Foto de ${fotoSeleccionada.cliente?.nombre ?? "cliente"}`}
              className="max-h-[82vh] max-w-[90vw] rounded-lg object-contain"
            />

            <button
              type="button"
              onClick={fotoSiguiente}
              className="absolute right-[-3.5rem] top-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-3 text-xl font-bold text-black shadow-lg hover:bg-gray-100"
              aria-label="Foto siguiente"
            >
              →
            </button>

            <div className="mt-3 w-full max-w-2xl rounded-xl bg-black/75 p-4 text-center text-white shadow-lg">
              <p className="text-base font-semibold">
                {fotoSeleccionada.cliente?.nombre ?? "Cliente desconocido"}
              </p>

              {fotoSeleccionada.tatuaje ? (
                <p className="mt-1 text-sm font-medium">
                  Tatuaje: {fotoSeleccionada.tatuaje.nombre}
                </p>
              ) : (
                <p className="mt-1 text-sm text-white/70">
                  Foto general
                </p>
              )}

              <div className="mt-2">
                <span className="inline-flex rounded-full border border-white/30 px-2.5 py-1 text-xs font-semibold uppercase">
                  {fotoSeleccionada.tipo}
                </span>
              </div>

              {fotoSeleccionada.descripcion && (
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  {fotoSeleccionada.descripcion}
                </p>
              )}

              <button
                type="button"
                onClick={() =>
                  eliminarFoto(fotoSeleccionada.id)
                }
                className="mt-4 rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
              >
                Eliminar foto
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
