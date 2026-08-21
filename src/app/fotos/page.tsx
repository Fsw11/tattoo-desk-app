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

  const tatuajesFiltrados =
    tatuajes.filter(
      (tatuaje) =>
        !clienteId ||
        tatuaje.clienteId ===
          Number(clienteId)
    );

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

              <input
                type="file"
                accept="image/*"
                onChange={seleccionarArchivo}
                className="block"
              />


              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  className="h-48 rounded-lg object-cover"
                />
              )}


              <select
                value={clienteId}
                onChange={(e) =>
                  setClienteId(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border p-2"
              >
                <option value="">
                  Cliente
                </option>

                {clientes.map(
                  (cliente) => (
                    <option
                      key={cliente.id}
                      value={cliente.id}
                    >
                      {cliente.nombre}
                    </option>
                  )
                )}

              </select>


              <select
                value={tatuajeId}
                onChange={(e) =>
                  setTatuajeId(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border p-2"
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
                disabled={guardando}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar foto"}
              </button>

            </form>

          </section>
        )}


        <section className="grid gap-5 md:grid-cols-3">

          {fotos.map(
            (foto) => (
              <article
                key={foto.id}
                className="overflow-hidden rounded-xl border bg-background"
              >

                <img
                  src={foto.url}
                  alt="foto"
                  className="h-64 w-full object-cover"
                />

                <div className="p-4">

                  <p className="font-semibold">
                    {foto.cliente.nombre}
                  </p>

                  <p className="text-sm">
                    {foto.tipo}
                  </p>

                  {foto.descripcion && (
                    <p className="text-sm text-muted-foreground">
                      {foto.descripcion}
                    </p>
                  )}

                </div>

              </article>
            )
          )}

        </section>

      </div>
    </main>
  );
}
