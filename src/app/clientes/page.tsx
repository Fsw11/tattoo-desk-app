"use client";

import { FormEvent, useEffect, useState } from "react";

type Foto = {
  id: number;
  url: string;
  descripcion: string | null;
  tipo: string;
  creadoEn: string;
};

type Pago = {
  id: number;
  monto: string | number;
  fecha: string;
  metodo: string;
  concepto: string | null;
};

type Tatuaje = {
  id: number;
  nombre: string;
  estilo: string | null;
  zona: string | null;
  precio: string | number | null;
  anticipo: string | number | null;
  estado: string;
  pagos: Pago[];
  fotos: Foto[];
};

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
  tatuajes: Tatuaje[];
  fotos: Foto[];
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [clienteAbierto, setClienteAbierto] = useState<number | null>(null);

  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [direccion, setDireccion] = useState("");
  const [alergias, setAlergias] = useState("");
  const [enfermedades, setEnfermedades] = useState("");
  const [notas, setNotas] = useState("");
  const [mostrarFormularioTatuaje, setMostrarFormularioTatuaje] =
    useState(false);
  const [guardandoTatuaje, setGuardandoTatuaje] = useState(false);
  const [tatuajeNombre, setTatuajeNombre] = useState("");
  const [tatuajeDescripcion, setTatuajeDescripcion] = useState("");
  const [tatuajeEstilo, setTatuajeEstilo] = useState("");
  const [tatuajeZona, setTatuajeZona] = useState("");
  const [tatuajePrecio, setTatuajePrecio] = useState("");
  const [tatuajeAnticipo, setTatuajeAnticipo] = useState("");
  const [tatuajeEstado, setTatuajeEstado] = useState("PENDIENTE");
  const [tatuajeNotas, setTatuajeNotas] = useState("");
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState<
    number | null
  >(null);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoMetodo, setPagoMetodo] = useState("EFECTIVO");
  const [pagoConcepto, setPagoConcepto] = useState("");
  const [pagoNotas, setPagoNotas] = useState("");
  const [mostrarFormularioFoto, setMostrarFormularioFoto] = useState<
    number | null
  >(null);
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
  const [fotoVistaPrevia, setFotoVistaPrevia] = useState("");
  const [fotoDescripcion, setFotoDescripcion] = useState("");
  const [fotoTipo, setFotoTipo] = useState("TATUAJE");
  const [mostrarFormularioFotoTatuaje, setMostrarFormularioFotoTatuaje] =
    useState<number | null>(null);
  const [fotoTatuajeUrl, setFotoTatuajeUrl] = useState("");
  const [fotoTatuajeDescripcion, setFotoTatuajeDescripcion] = useState("");
  const [fotoTatuajeTipo, setFotoTatuajeTipo] = useState("DISENO");

  async function crearFotoTatuaje(clienteId: number, tatuajeId: number) {
    if (!fotoTatuajeUrl.trim()) {
      setError("La URL de la imagen es obligatoria.");
      return;
    }

    try {
      setError("");

      const respuesta = await fetch("/api/fotos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId,
          tatuajeId,
          url: fotoTatuajeUrl.trim(),
          descripcion: fotoTatuajeDescripcion.trim() || null,
          tipo: fotoTatuajeTipo,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo guardar la foto.");
      }

      setFotoTatuajeUrl("");
      setFotoTatuajeDescripcion("");
      setFotoTatuajeTipo("DISENO");
      setMostrarFormularioFotoTatuaje(null);

      await cargarClientes();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al guardar la foto."
      );
    }
  }

  async function eliminarFoto(fotoId: number) {
    const confirmar = window.confirm("¿Seguro que quieres eliminar esta foto?");

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
        throw new Error(datos.error || "No se pudo eliminar la foto.");
      }

      await cargarClientes();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al eliminar la foto."
      );
    }
  }

  async function crearPago(clienteId: number, tatuajeId: number) {
    if (!pagoMonto.trim()) {
      setError("El monto es obligatorio.");
      return;
    }

    try {
      setGuardandoPago(true);
      setError("");

      const respuesta = await fetch("/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId,
          tatuajeId,
          monto: Number(pagoMonto),
          metodo: pagoMetodo,
          concepto: pagoConcepto.trim() || null,
          notas: pagoNotas.trim() || null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo registrar el pago.");
      }

      setPagoMonto("");
      setPagoConcepto("");
      setPagoNotas("");
      setPagoMetodo("EFECTIVO");

      setMostrarFormularioPago(null);

      await cargarClientes();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al registrar el pago."
      );
    } finally {
      setGuardandoPago(false);
    }
  }

  async function subirArchivoFoto() {
    if (!fotoArchivo) {
      return null;
    }

    const formData = new FormData();

    formData.append("archivo", fotoArchivo);

    const respuesta = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudo subir la imagen.");
    }

    return datos.url as string;
  }

  async function crearFoto(clienteId: number, tatuajeId?: number) {
    if (!fotoArchivo && !fotoUrl.trim()) {
      setError("Selecciona una imagen o escribe una URL.");
      return;
    }

    try {
      setGuardandoFoto(true);
      setError("");

      const urlImagen = fotoArchivo ? await subirArchivoFoto() : fotoUrl.trim();

      const respuesta = await fetch("/api/fotos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId,
          tatuajeId: tatuajeId ?? null,
          url: urlImagen,
          descripcion: fotoDescripcion.trim() || null,
          tipo: fotoTipo,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo guardar la foto.");
      }

      setFotoUrl("");
      setFotoArchivo(null);
      setFotoDescripcion("");
      setFotoTipo("TATUAJE");
      setMostrarFormularioFoto(null);

      await cargarClientes();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al guardar la foto."
      );
    } finally {
      setGuardandoFoto(false);
    }
  }

  async function cargarClientes() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch("/api/clientes", {
        cache: "no-store",
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudieron cargar los clientes.");
      }

      const clientesNormalizados: Cliente[] = Array.isArray(datos)
        ? datos.map((cliente: any): Cliente => ({
            id: Number(cliente.id),

            nombre: cliente.nombre ?? "",
            telefono: cliente.telefono ?? "",

            email: cliente.email ?? null,
            instagram: cliente.instagram ?? null,
            direccion: cliente.direccion ?? null,
            alergias: cliente.alergias ?? null,
            enfermedades: cliente.enfermedades ?? null,
            notas: cliente.notas ?? null,

            creadoEn: cliente.creadoEn ?? "",
            actualizadoEn: cliente.actualizadoEn ?? "",

            tatuajes: Array.isArray(cliente.tatuajes)
              ? cliente.tatuajes.map((tatuaje: any) => ({
                  id: Number(tatuaje.id),

                  nombre: tatuaje.nombre ?? "",
                  estilo: tatuaje.estilo ?? null,
                  zona: tatuaje.zona ?? null,

                  precio: tatuaje.precio ?? null,
                  anticipo: tatuaje.anticipo ?? null,

                  estado: tatuaje.estado ?? "",

                  pagos: Array.isArray(tatuaje.pagos) ? tatuaje.pagos : [],

                  fotos: Array.isArray(tatuaje.fotos) ? tatuaje.fotos : [],
                }))
              : [],

            fotos: Array.isArray(cliente.fotos) ? cliente.fotos : [],
          }))
        : [];

      setClientes(clientesNormalizados);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al cargar clientes."
      );
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
    setDireccion("");
    setAlergias("");
    setEnfermedades("");
    setNotas("");
  }

  function cargarDatosFormulario(cliente: Cliente) {
    setNombre(cliente.nombre);
    setTelefono(cliente.telefono);
    setEmail(cliente.email ?? "");
    setInstagram(cliente.instagram ?? "");
    setDireccion(cliente.direccion ?? "");
    setAlergias(cliente.alergias ?? "");
    setEnfermedades(cliente.enfermedades ?? "");
    setNotas(cliente.notas ?? "");
  }

  function abrirEdicion(cliente: Cliente) {
    setError("");
    cargarDatosFormulario(cliente);
    setClienteEditando(cliente);
    setMostrarFormulario(false);
  }

  async function crearCliente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nombre.trim() || !telefono.trim()) {
      setError("El nombre y teléfono son obligatorios.");
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
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim() || null,
          instagram: instagram.trim() || null,
          direccion: direccion.trim() || null,
          alergias: alergias.trim() || null,
          enfermedades: enfermedades.trim() || null,
          notas: notas.trim() || null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo crear el cliente.");
      }

      limpiarFormulario();
      setMostrarFormulario(false);

      await cargarClientes();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al crear cliente."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function actualizarCliente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clienteEditando) return;

    if (!nombre.trim() || !telefono.trim()) {
      setError("El nombre y teléfono son obligatorios.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch("/api/clientes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: clienteEditando.id,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim() || null,
          instagram: instagram.trim() || null,
          direccion: direccion.trim() || null,
          alergias: alergias.trim() || null,
          enfermedades: enfermedades.trim() || null,
          notas: notas.trim() || null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo actualizar el cliente.");
      }

      setClienteEditando(null);
      limpiarFormulario();

      await cargarClientes();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al actualizar cliente."
      );
    } finally {
      setGuardando(false);
    }
  }

  function cancelarEdicion() {
    setClienteEditando(null);
    limpiarFormulario();
    setError("");
  }

  async function crearTatuaje(clienteId: number) {
    if (!tatuajeNombre.trim()) {
      setError("El nombre del tatuaje es obligatorio.");
      return;
    }

    try {
      setGuardandoTatuaje(true);
      setError("");

      const respuesta = await fetch("/api/tatuajes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId,
          nombre: tatuajeNombre.trim(),
          descripcion: tatuajeDescripcion.trim() || null,
          estilo: tatuajeEstilo.trim() || null,
          zona: tatuajeZona.trim() || null,
          precio: tatuajePrecio.trim() ? Number(tatuajePrecio) : null,
          anticipo: tatuajeAnticipo.trim() ? Number(tatuajeAnticipo) : null,
          estado: tatuajeEstado,
          notas: tatuajeNotas.trim() || null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo crear el tatuaje.");
      }

      setTatuajeNombre("");
      setTatuajeDescripcion("");
      setTatuajeEstilo("");
      setTatuajeZona("");
      setTatuajePrecio("");
      setTatuajeAnticipo("");
      setTatuajeEstado("PENDIENTE");
      setTatuajeNotas("");

      setMostrarFormularioTatuaje(false);

      await cargarClientes();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Error al crear tatuaje."
      );
    } finally {
      setGuardandoTatuaje(false);
    }
  }

  function calcularTotalPagado(pagos: Pago[]) {
    return pagos.reduce((total, pago) => total + Number(pago.monto), 0);
  }

  function calcularSaldo(precio: string | number | null, pagos: Pago[]) {
    return Math.max(Number(precio ?? 0) - calcularTotalPagado(pagos), 0);
  }

  function formatoMoneda(cantidad: string | number) {
    return Number(cantidad).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    });
  }

  function nombreMetodo(metodo: string) {
    switch (metodo) {
      case "EFECTIVO":
        return "Efectivo";

      case "TARJETA":
        return "Tarjeta";

      case "TRANSFERENCIA":
        return "Transferencia";

      default:
        return "Otro";
    }
  }
  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Gestión del estudio</p>

            <h1 className="text-3xl font-bold">Clientes</h1>
          </div>

          {!mostrarFormulario && !clienteEditando && (
            <button
              type="button"
              onClick={() => {
                setError("");
                limpiarFormulario();
                setMostrarFormulario(true);
              }}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Nuevo cliente
            </button>
          )}
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {mostrarFormulario && (
          <section className="rounded-xl border bg-background p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Nuevo cliente</h2>

              <button
                type="button"
                onClick={() => {
                  limpiarFormulario();
                  setMostrarFormulario(false);
                  setError("");
                }}
                className="rounded-lg border px-3 py-2"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={crearCliente} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nombre *
                  </label>

                  <input
                    placeholder="Nombre completo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Teléfono *
                  </label>

                  <input
                    placeholder="Teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Correo
                  </label>

                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Instagram
                  </label>

                  <input
                    placeholder="@usuario"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Dirección
                  </label>

                  <input
                    placeholder="Dirección"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Alergias
                  </label>

                  <textarea
                    placeholder="Alergias conocidas"
                    value={alergias}
                    onChange={(e) => setAlergias(e.target.value)}
                    className="min-h-24 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Enfermedades
                  </label>

                  <textarea
                    placeholder="Información relevante"
                    value={enfermedades}
                    onChange={(e) => setEnfermedades(e.target.value)}
                    className="min-h-24 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Notas
                  </label>

                  <textarea
                    placeholder="Notas del cliente"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="min-h-24 w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario();
                    setMostrarFormulario(false);
                    setError("");
                  }}
                  className="rounded-lg border px-4 py-2"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar cliente"}
                </button>
              </div>
            </form>
          </section>
        )}

        {clienteEditando && (
          <section className="rounded-xl border bg-background p-6">
            <div className="mb-5">
              <p className="text-sm text-muted-foreground">Editando cliente</p>

              <h2 className="text-xl font-semibold">
                {clienteEditando.nombre}
              </h2>
            </div>

            <form onSubmit={actualizarCliente} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nombre *
                  </label>

                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Teléfono *
                  </label>

                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Correo
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Instagram
                  </label>

                  <input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Dirección
                  </label>

                  <input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Alergias
                  </label>

                  <textarea
                    value={alergias}
                    onChange={(e) => setAlergias(e.target.value)}
                    className="min-h-24 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Enfermedades
                  </label>

                  <textarea
                    value={enfermedades}
                    onChange={(e) => setEnfermedades(e.target.value)}
                    className="min-h-24 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Notas
                  </label>

                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="min-h-24 w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="rounded-lg border px-4 py-2"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="space-y-4">
          {cargando && (
            <div className="rounded-xl border bg-background p-6">
              Cargando clientes...
            </div>
          )}

          {!cargando && !error && clientes.length === 0 && (
            <div className="rounded-xl border bg-background p-8 text-center">
              <h2 className="text-lg font-semibold">
                No hay clientes registrados
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Agrega tu primer cliente para comenzar.
              </p>
            </div>
          )}

          {!cargando &&
            clientes.map((cliente) => {
              const tatuajes = Array.isArray(cliente.tatuajes)
                ? cliente.tatuajes
                : [];

              const fotos = Array.isArray(cliente.fotos) ? cliente.fotos : [];

              return (
                <article
                  key={cliente.id}
                  className="rounded-xl border bg-background p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {cliente.nombre}
                      </h2>

                      <p className="mt-1">{cliente.telefono}</p>

                      {cliente.email && (
                        <p className="text-sm text-muted-foreground">
                          {cliente.email}
                        </p>
                      )}

                      <p className="mt-1 text-sm text-muted-foreground">
                        {tatuajes.length} tatuaje(s)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setClienteAbierto(
                            clienteAbierto === cliente.id ? null : cliente.id
                          );
                        }}
                        className="rounded-lg border px-4 py-2"
                      >
                        {clienteAbierto === cliente.id
                          ? "Cerrar ficha"
                          : "Ver ficha"}
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirEdicion(cliente)}
                        className="rounded-lg border px-4 py-2"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                  {clienteAbierto === cliente.id && (
                    <div className="mt-5 space-y-6 border-t pt-5">
                      <section>
                        <h3 className="text-lg font-semibold">
                          Información del cliente
                        </h3>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {cliente.instagram && (
                            <div className="rounded-lg border p-4">
                              <p className="text-sm text-muted-foreground">
                                Instagram
                              </p>
                              <p className="font-medium">{cliente.instagram}</p>
                            </div>
                          )}

                          {cliente.direccion && (
                            <div className="rounded-lg border p-4">
                              <p className="text-sm text-muted-foreground">
                                Dirección
                              </p>
                              <p className="font-medium">{cliente.direccion}</p>
                            </div>
                          )}

                          {cliente.alergias && (
                            <div className="rounded-lg border p-4">
                              <p className="text-sm text-muted-foreground">
                                Alergias
                              </p>
                              <p className="font-medium">{cliente.alergias}</p>
                            </div>
                          )}

                          {cliente.enfermedades && (
                            <div className="rounded-lg border p-4">
                              <p className="text-sm text-muted-foreground">
                                Enfermedades
                              </p>
                              <p className="font-medium">
                                {cliente.enfermedades}
                              </p>
                            </div>
                          )}

                          {cliente.notas && (
                            <div className="rounded-lg border p-4 md:col-span-2">
                              <p className="text-sm text-muted-foreground">
                                Notas
                              </p>
                              <p className="font-medium">{cliente.notas}</p>
                            </div>
                          )}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold">
                          Galería del cliente
                        </h3>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setError("");

                              setMostrarFormularioFoto(
                                mostrarFormularioFoto === cliente.id
                                  ? null
                                  : cliente.id
                              );
                            }}
                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                          >
                            {mostrarFormularioFoto === cliente.id
                              ? "Cancelar"
                              : "Agregar foto"}
                          </button>
                        </div>

                        {mostrarFormularioFoto === cliente.id && (
                          <section className="mt-4 rounded-xl border bg-muted/30 p-5">
                            <h4 className="mb-4 font-semibold">
                              Nueva foto del cliente
                            </h4>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium">
                                  URL de imagen *
                                </label>

                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const archivo = e.target.files?.[0] ?? null;

                                    setFotoArchivo(archivo);

                                    if (archivo) {
                                      setFotoVistaPrevia(
                                        URL.createObjectURL(archivo)
                                      );
                                    } else {
                                      setFotoVistaPrevia("");
                                    }
                                  }}
                                  className="w-full rounded-lg border px-3 py-2"
                                />

                                {fotoVistaPrevia && (
                                  <div className="mt-3">
                                    <p className="mb-2 text-sm font-medium">
                                      Vista previa
                                    </p>

                                    <img
                                      src={fotoVistaPrevia}
                                      alt="Vista previa"
                                      className="h-48 w-full rounded-lg border object-cover"
                                    />
                                  </div>
                                )}

                                <input
                                  placeholder="https://imagen.com/foto.jpg"
                                  value={fotoUrl}
                                  onChange={(e) => setFotoUrl(e.target.value)}
                                  className="w-full rounded-lg border bg-background px-3 py-2"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Tipo
                                </label>

                                <select
                                  value={fotoTipo}
                                  onChange={(e) => setFotoTipo(e.target.value)}
                                  className="w-full rounded-lg border bg-background px-3 py-2"
                                >
                                  <option value="TATUAJE">Tatuaje</option>

                                  <option value="ANTES">Antes</option>

                                  <option value="DESPUES">Después</option>

                                  <option value="DISENO">Diseño</option>

                                  <option value="OTRA">Otra</option>
                                </select>
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Descripción
                                </label>

                                <input
                                  placeholder="Descripción de la foto"
                                  value={fotoDescripcion}
                                  onChange={(e) =>
                                    setFotoDescripcion(e.target.value)
                                  }
                                  className="w-full rounded-lg border bg-background px-3 py-2"
                                />
                              </div>
                            </div>

                            <div className="mt-5 flex justify-end">
                              <button
                                type="button"
                                disabled={guardandoFoto}
                                onClick={() => crearFoto(cliente.id)}
                                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                              >
                                {guardandoFoto
                                  ? "Guardando..."
                                  : "Guardar foto"}
                              </button>
                            </div>
                          </section>
                        )}

                        {fotos.length === 0 ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No hay fotos generales.
                          </p>
                        ) : (
                          <div className="mt-3 grid gap-4 md:grid-cols-4">
                            {fotos.map((foto) => (
                              <div
                                key={foto.id}
                                className="overflow-hidden rounded-lg border"
                              >
                                <img
                                  src={foto.url}
                                  alt={foto.descripcion || "Foto del cliente"}
                                  className="h-40 w-full object-cover"
                                />

                                <div className="p-3">
                                  <p className="font-medium">{foto.tipo}</p>

                                  {foto.descripcion && (
                                    <p className="text-sm text-muted-foreground">
                                      {foto.descripcion}
                                    </p>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => eliminarFoto(foto.id)}
                                    className="mt-3 rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setMostrarFormularioTatuaje(
                              !mostrarFormularioTatuaje
                            );
                          }}
                          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                        >
                          {mostrarFormularioTatuaje
                            ? "Cancelar"
                            : "Nuevo tatuaje"}
                        </button>
                      </div>

                      {mostrarFormularioTatuaje && (
                        <section className="rounded-xl border bg-background p-5">
                          <h3 className="mb-4 text-lg font-semibold">
                            Nuevo tatuaje para {cliente.nombre}
                          </h3>

                          <div className="grid gap-4 md:grid-cols-2">
                            <input
                              placeholder="Nombre del tatuaje"
                              value={tatuajeNombre}
                              onChange={(e) => setTatuajeNombre(e.target.value)}
                              className="rounded-lg border px-3 py-2"
                            />

                            <input
                              placeholder="Estilo"
                              value={tatuajeEstilo}
                              onChange={(e) => setTatuajeEstilo(e.target.value)}
                              className="rounded-lg border px-3 py-2"
                            />

                            <input
                              placeholder="Zona del cuerpo"
                              value={tatuajeZona}
                              onChange={(e) => setTatuajeZona(e.target.value)}
                              className="rounded-lg border px-3 py-2"
                            />

                            <input
                              placeholder="Precio"
                              type="number"
                              value={tatuajePrecio}
                              onChange={(e) => setTatuajePrecio(e.target.value)}
                              className="rounded-lg border px-3 py-2"
                            />

                            <input
                              placeholder="Anticipo"
                              type="number"
                              value={tatuajeAnticipo}
                              onChange={(e) =>
                                setTatuajeAnticipo(e.target.value)
                              }
                              className="rounded-lg border px-3 py-2"
                            />

                            <select
                              value={tatuajeEstado}
                              onChange={(e) => setTatuajeEstado(e.target.value)}
                              className="rounded-lg border px-3 py-2"
                            >
                              <option value="PENDIENTE">Pendiente</option>

                              <option value="EN_PROCESO">En proceso</option>

                              <option value="TERMINADO">Terminado</option>

                              <option value="CANCELADO">Cancelado</option>
                            </select>

                            <textarea
                              placeholder="Descripción"
                              value={tatuajeDescripcion}
                              onChange={(e) =>
                                setTatuajeDescripcion(e.target.value)
                              }
                              className="min-h-24 rounded-lg border px-3 py-2 md:col-span-2"
                            />

                            <textarea
                              placeholder="Notas"
                              value={tatuajeNotas}
                              onChange={(e) => setTatuajeNotas(e.target.value)}
                              className="min-h-24 rounded-lg border px-3 py-2 md:col-span-2"
                            />
                          </div>

                          <div className="mt-5 flex justify-end">
                            <button
                              type="button"
                              disabled={guardandoTatuaje}
                              onClick={() => crearTatuaje(cliente.id)}
                              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                            >
                              {guardandoTatuaje
                                ? "Guardando..."
                                : "Guardar tatuaje"}
                            </button>
                          </div>
                        </section>
                      )}

                      <section>
                        <h3 className="text-lg font-semibold">Tatuajes</h3>

                        {tatuajes.length === 0 ? (
                          <p className="mt-3 text-sm text-muted-foreground">
                            No hay tatuajes registrados.
                          </p>
                        ) : (
                          <div className="space-y-5">
                            {tatuajes.map((tatuaje) => {
                              const pagos = Array.isArray(tatuaje.pagos)
                                ? tatuaje.pagos
                                : [];

                              const fotosTatuaje = Array.isArray(tatuaje.fotos)
                                ? tatuaje.fotos
                                : [];

                              const totalPagado = calcularTotalPagado(pagos);

                              const saldo = calcularSaldo(
                                tatuaje.precio,
                                pagos
                              );

                              return (
                                <div
                                  key={tatuaje.id}
                                  className="rounded-xl border p-5"
                                >
                                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                                    <div>
                                      <h4 className="text-lg font-semibold">
                                        {tatuaje.nombre}
                                      </h4>

                                      <p className="text-sm">
                                        Estado: {tatuaje.estado}
                                      </p>

                                      {tatuaje.estilo && (
                                        <p className="text-sm text-muted-foreground">
                                          Estilo: {tatuaje.estilo}
                                        </p>
                                      )}

                                      {tatuaje.zona && (
                                        <p className="text-sm text-muted-foreground">
                                          Zona: {tatuaje.zona}
                                        </p>
                                      )}
                                    </div>

                                    <div className="text-left md:text-right">
                                      <p className="text-sm text-muted-foreground">
                                        Precio
                                      </p>

                                      <p className="text-xl font-bold">
                                        {formatoMoneda(tatuaje.precio ?? 0)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-lg border p-4">
                                      <p className="text-sm text-muted-foreground">
                                        Total pagado
                                      </p>

                                      <p className="font-semibold">
                                        {formatoMoneda(totalPagado)}
                                      </p>
                                    </div>

                                    <div className="rounded-lg border p-4">
                                      <p className="text-sm text-muted-foreground">
                                        Saldo pendiente
                                      </p>

                                      <p className="font-semibold">
                                        {formatoMoneda(saldo)}
                                      </p>
                                    </div>

                                    <div className="rounded-lg border p-4">
                                      <p className="text-sm text-muted-foreground">
                                        Pagos
                                      </p>

                                      <p className="font-semibold">
                                        {pagos.length}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-6">
                                    <h5 className="font-semibold">
                                      Fotos del tatuaje
                                    </h5>

                                    <div className="mt-3 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setMostrarFormularioFotoTatuaje(
                                            tatuaje.id
                                          )
                                        }
                                        className="rounded-lg border px-3 py-2 text-sm"
                                      >
                                        Agregar foto
                                      </button>
                                    </div>

                                    {mostrarFormularioFotoTatuaje ===
                                      tatuaje.id && (
                                      <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                                        <h6 className="mb-3 font-semibold">
                                          Agregar foto al tatuaje
                                        </h6>

                                        <div className="grid gap-3 md:grid-cols-2">
                                          <input
                                            type="text"
                                            placeholder="URL de la imagen"
                                            value={fotoTatuajeUrl}
                                            onChange={(e) =>
                                              setFotoTatuajeUrl(e.target.value)
                                            }
                                            className="rounded-lg border px-3 py-2"
                                          />

                                          <select
                                            value={fotoTatuajeTipo}
                                            onChange={(e) =>
                                              setFotoTatuajeTipo(e.target.value)
                                            }
                                            className="rounded-lg border px-3 py-2"
                                          >
                                            <option value="DISENO">
                                              Diseño
                                            </option>
                                            <option value="PROCESO">
                                              Proceso
                                            </option>
                                            <option value="RESULTADO">
                                              Resultado
                                            </option>
                                            <option value="OTRA">Otra</option>
                                          </select>

                                          <textarea
                                            placeholder="Descripción de la foto"
                                            value={fotoTatuajeDescripcion}
                                            onChange={(e) =>
                                              setFotoTatuajeDescripcion(
                                                e.target.value
                                              )
                                            }
                                            className="min-h-20 rounded-lg border px-3 py-2 md:col-span-2"
                                          />
                                        </div>

                                        <div className="mt-3 flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMostrarFormularioFotoTatuaje(
                                                null
                                              );
                                              setFotoTatuajeUrl("");
                                              setFotoTatuajeDescripcion("");
                                              setFotoTatuajeTipo("DISENO");
                                            }}
                                            className="rounded-lg border px-3 py-2"
                                          >
                                            Cancelar
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              crearFotoTatuaje(
                                                cliente.id,
                                                tatuaje.id
                                              )
                                            }
                                            className="rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                                          >
                                            Guardar foto
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {fotosTatuaje.length === 0 ? (
                                      <p className="mt-2 text-sm text-muted-foreground">
                                        No hay fotos del tatuaje.
                                      </p>
                                    ) : (
                                      <div className="mt-3 grid gap-4 md:grid-cols-4">
                                        {fotosTatuaje.map((foto) => (
                                          <div
                                            key={foto.id}
                                            className="overflow-hidden rounded-lg border"
                                          >
                                            <img
                                              src={foto.url}
                                              alt={
                                                foto.descripcion ||
                                                "Foto tatuaje"
                                              }
                                              className="h-40 w-full object-cover"
                                            />

                                            <div className="p-2">
                                              <p className="text-sm font-medium">
                                                {foto.tipo}
                                              </p>

                                              {foto.descripcion && (
                                                <p className="text-xs text-muted-foreground">
                                                  {foto.descripcion}
                                                </p>
                                              )}

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  eliminarFoto(foto.id)
                                                }
                                                className="mt-3 rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600"
                                              >
                                                Eliminar
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <h5 className="font-semibold">
                                        Registrar pago
                                      </h5>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setError("");
                                          setMostrarFormularioPago(
                                            mostrarFormularioPago === tatuaje.id
                                              ? null
                                              : tatuaje.id
                                          );
                                        }}
                                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                                      >
                                        {mostrarFormularioPago === tatuaje.id
                                          ? "Cancelar pago"
                                          : "Registrar pago"}
                                      </button>
                                    </div>

                                    {mostrarFormularioPago === tatuaje.id && (
                                      <form
                                        onSubmit={(event) => {
                                          event.preventDefault();
                                          crearPago(cliente.id, tatuaje.id);
                                        }}
                                        className="mt-4 rounded-xl border bg-muted/30 p-5"
                                      >
                                        <div className="grid gap-4 md:grid-cols-2">
                                          <div>
                                            <label className="mb-1 block text-sm font-medium">
                                              Monto *
                                            </label>

                                            <input
                                              type="number"
                                              min="0.01"
                                              step="0.01"
                                              placeholder="0.00"
                                              value={pagoMonto}
                                              onChange={(event) =>
                                                setPagoMonto(event.target.value)
                                              }
                                              className="w-full rounded-lg border bg-background px-3 py-2"
                                              required
                                            />
                                          </div>

                                          <div>
                                            <label className="mb-1 block text-sm font-medium">
                                              Método de pago *
                                            </label>

                                            <select
                                              value={pagoMetodo}
                                              onChange={(event) =>
                                                setPagoMetodo(
                                                  event.target.value
                                                )
                                              }
                                              className="w-full rounded-lg border bg-background px-3 py-2"
                                            >
                                              <option value="EFECTIVO">
                                                Efectivo
                                              </option>

                                              <option value="TARJETA">
                                                Tarjeta
                                              </option>

                                              <option value="TRANSFERENCIA">
                                                Transferencia
                                              </option>

                                              <option value="OTRO">Otro</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="mb-1 block text-sm font-medium">
                                              Concepto
                                            </label>

                                            <input
                                              placeholder="Ej. Anticipo"
                                              value={pagoConcepto}
                                              onChange={(event) =>
                                                setPagoConcepto(
                                                  event.target.value
                                                )
                                              }
                                              className="w-full rounded-lg border bg-background px-3 py-2"
                                            />
                                          </div>

                                          <div>
                                            <label className="mb-1 block text-sm font-medium">
                                              Notas
                                            </label>

                                            <input
                                              placeholder="Notas del pago"
                                              value={pagoNotas}
                                              onChange={(event) =>
                                                setPagoNotas(event.target.value)
                                              }
                                              className="w-full rounded-lg border bg-background px-3 py-2"
                                            />
                                          </div>
                                        </div>

                                        <div className="mt-4 flex justify-end gap-3">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMostrarFormularioPago(null);
                                              setPagoMonto("");
                                              setPagoConcepto("");
                                              setPagoNotas("");
                                              setPagoMetodo("EFECTIVO");
                                              setError("");
                                            }}
                                            className="rounded-lg border px-4 py-2"
                                          >
                                            Cancelar
                                          </button>

                                          <button
                                            type="submit"
                                            disabled={guardandoPago}
                                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                                          >
                                            {guardandoPago
                                              ? "Guardando..."
                                              : "Guardar pago"}
                                          </button>
                                        </div>
                                      </form>
                                    )}
                                  </div>

                                  <div className="mt-6">
                                    <h5 className="mb-3 font-semibold">
                                      Historial de pagos
                                    </h5>

                                    {pagos.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">
                                        Sin pagos registrados.
                                      </p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full">
                                          <thead>
                                            <tr className="border-b text-left text-sm">
                                              <th className="px-3 py-2">
                                                Fecha
                                              </th>

                                              <th className="px-3 py-2">
                                                Método
                                              </th>

                                              <th className="px-3 py-2">
                                                Concepto
                                              </th>

                                              <th className="px-3 py-2 text-right">
                                                Monto
                                              </th>
                                            </tr>
                                          </thead>

                                          <tbody>
                                            {pagos.map((pago) => (
                                              <tr
                                                key={pago.id}
                                                className="border-b"
                                              >
                                                <td className="px-3 py-2">
                                                  {new Date(
                                                    pago.fecha
                                                  ).toLocaleDateString("es-MX")}
                                                </td>

                                                <td className="px-3 py-2">
                                                  {nombreMetodo(pago.metodo)}
                                                </td>

                                                <td className="px-3 py-2">
                                                  {pago.concepto || "—"}
                                                </td>

                                                <td className="px-3 py-2 text-right font-semibold">
                                                  {formatoMoneda(pago.monto)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    </div>
                  )}
                </article>
              );
            })}
        </section>
      </div>
    </main>
  );
}
