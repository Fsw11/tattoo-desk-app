"use client";

import { FormEvent, useEffect, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
};

type Tatuaje = {
  id: number;
  nombre: string;
  descripcion: string | null;
  estilo: string | null;
  zona: string | null;
  precio: string | number | null;
  anticipo: string | number | null;
  estado: string;
  cliente: Cliente;
  usuario: {
    id: number;
    nombre: string;
  } | null;
};

export default function TatuajesPage() {
  const [tatuajes, setTatuajes] = useState<Tatuaje[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estilo, setEstilo] = useState("");
  const [zona, setZona] = useState("");
  const [precio, setPrecio] = useState("");
  const [anticipo, setAnticipo] = useState("");
  const [notas, setNotas] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);

      const [resTatuajes, resClientes] =
        await Promise.all([
          fetch("/api/tatuajes"),
          fetch("/api/clientes/select"),
        ]);

      const datosTatuajes = await resTatuajes.json();
      const datosClientes = await resClientes.json();

      if (!resTatuajes.ok || !resClientes.ok) {
        throw new Error("No se pudieron cargar los datos.");
      }

      setTatuajes(datosTatuajes);
      setClientes(datosClientes);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function limpiar() {
    setClienteId("");
    setNombre("");
    setDescripcion("");
    setEstilo("");
    setZona("");
    setPrecio("");
    setAnticipo("");
    setNotas("");
  }

  async function crearTatuaje(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch(
        "/api/tatuajes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clienteId,
            nombre,
            descripcion,
            estilo,
            zona,
            precio,
            anticipo,
            notas,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo crear el tatuaje."
        );
      }

      setTatuajes((actuales) => [
        datos,
        ...actuales,
      ]);

      limpiar();
      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al crear tatuaje."
      );
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
              Gestión del estudio
            </p>

            <h1 className="text-3xl font-bold">
              Tatuajes
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarFormulario(true)
            }
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          >
            Nuevo tatuaje
          </button>
        </header>

        {mostrarFormulario && (
          <section className="rounded-xl border bg-background p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Registrar tatuaje
            </h2>

            <form
              onSubmit={crearTatuaje}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  value={clienteId}
                  onChange={(e) =>
                    setClienteId(e.target.value)
                  }
                  required
                  className="rounded-lg border px-3 py-2"
                >
                  <option value="">
                    Seleccionar cliente
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

                <input
                  placeholder="Nombre del tatuaje"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                  required
                  className="rounded-lg border px-3 py-2"
                />

                <input
                  placeholder="Estilo"
                  value={estilo}
                  onChange={(e) =>
                    setEstilo(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                />

                <input
                  placeholder="Zona del cuerpo"
                  value={zona}
                  onChange={(e) =>
                    setZona(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                />

                <input
                  placeholder="Precio"
                  type="number"
                  value={precio}
                  onChange={(e) =>
                    setPrecio(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                />

                <input
                  placeholder="Anticipo"
                  type="number"
                  value={anticipo}
                  onChange={(e) =>
                    setAnticipo(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                />
              </div>

              <textarea
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              />

              <textarea
                placeholder="Notas"
                value={notas}
                onChange={(e) =>
                  setNotas(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              />

              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                disabled={guardando}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar tatuaje"}
              </button>
            </form>
          </section>
        )}

        {cargando ? (
          <div className="rounded-xl border bg-background p-6">
            Cargando...
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2">
            {tatuajes.map((tatuaje) => (
              <article
                key={tatuaje.id}
                className="rounded-xl border bg-background p-6"
              >
                <h2 className="text-xl font-semibold">
                  {tatuaje.nombre}
                </h2>

                <p>
                  Cliente:{" "}
                  {tatuaje.cliente.nombre}
                </p>

                {tatuaje.estilo && (
                  <p>Estilo: {tatuaje.estilo}</p>
                )}

                {tatuaje.zona && (
                  <p>Zona: {tatuaje.zona}</p>
                )}

                <p>
                  Estado: {tatuaje.estado}
                </p>

                {tatuaje.precio && (
                  <p>
                    Precio: $
                    {tatuaje.precio.toString()}
                  </p>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
