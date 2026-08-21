"use client";

import { FormEvent, useEffect, useState } from "react";

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
};

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email: string | null;
  instagram: string | null;
  creadoEn: string;
  tatuajes: Tatuaje[];
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteAbierto, setClienteAbierto] =
    useState<number | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);
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
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudieron cargar los clientes."
        );
      }

      setClientes(datos);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los clientes."
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
  }

  async function crearCliente(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!nombre.trim() || !telefono.trim()) {
      setError(
        "El nombre y el teléfono son obligatorios."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch(
        "/api/clientes",
        {
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
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            "No se pudo crear el cliente."
        );
        return;
      }

      setClientes((actuales) => [
        datos,
        ...actuales,
      ]);

      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al crear el cliente."
      );
    } finally {
      setGuardando(false);
    }
  }

  function calcularTotalPagado(
    pagos: Pago[]
  ) {
    return pagos.reduce(
      (total, pago) =>
        total + Number(pago.monto),
      0
    );
  }

  function calcularSaldo(
    precio: string | number | null,
    pagos: Pago[]
  ) {
    const total = Number(precio ?? 0);
    const pagado = calcularTotalPagado(pagos);

    return Math.max(total - pagado, 0);
  }

  function formatoMoneda(
    cantidad: string | number
  ) {
    return Number(cantidad).toLocaleString(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
      }
    );
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
                  <label className="text-sm font-medium">
                    Nombre *
                  </label>

                  <input
                    type="text"
                    value={nombre}
                    onChange={(event) =>
                      setNombre(event.target.value)
                    }
                    placeholder="Nombre completo"
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Teléfono *
                  </label>

                  <input
                    type="tel"
                    value={telefono}
                    onChange={(event) =>
                      setTelefono(event.target.value)
                    }
                    placeholder="6861234567"
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Correo electrónico
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="cliente@correo.com"
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Instagram
                  </label>

                  <input
                    type="text"
                    value={instagram}
                    onChange={(event) =>
                      setInstagram(event.target.value)
                    }
                    placeholder="@usuario"
                    className="w-full rounded-lg border bg-background px-3 py-2"
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
                  onClick={() => {
                    limpiarFormulario();
                    setMostrarFormulario(false);
                    setError("");
                  }}
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
                    : "Guardar cliente"}
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

        <section className="space-y-4">
          {cargando && (
            <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
              Cargando clientes...
            </div>
          )}

          {!cargando &&
            clientes.length === 0 && (
              <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
                No hay clientes registrados.
              </div>
            )}

          {!cargando &&
            clientes.map((cliente) => (
              <article
                key={cliente.id}
                className="rounded-xl border bg-background p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {cliente.nombre}
                    </h2>

                    <p>{cliente.telefono}</p>

                    {cliente.email && (
                      <p className="text-sm text-muted-foreground">
                        {cliente.email}
                      </p>
                    )}

                    {cliente.instagram && (
                      <p className="text-sm text-muted-foreground">
                        {cliente.instagram}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-muted-foreground">
                      {cliente.tatuajes.length}{" "}
                      tatuaje
                      {cliente.tatuajes.length === 1
                        ? ""
                        : "s"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setClienteAbierto(
                        clienteAbierto === cliente.id
                          ? null
                          : cliente.id
                      )
                    }
                    className="rounded-lg border px-4 py-2"
                  >
                    {clienteAbierto === cliente.id
                      ? "Cerrar ficha"
                      : "Ver ficha"}
                  </button>
                </div>

                {clienteAbierto === cliente.id && (
                  <div className="mt-5 space-y-5 border-t pt-5">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Tatuajes
                      </h3>
                    </div>

                    {cliente.tatuajes.length === 0 ? (
                      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                        Este cliente todavía no tiene tatuajes registrados.
                      </div>
                    ) : (
                      cliente.tatuajes.map(
                        (tatuaje) => {
                          const totalPagado =
                            calcularTotalPagado(
                              tatuaje.pagos
                            );

                          const saldo =
                            calcularSaldo(
                              tatuaje.precio,
                              tatuaje.pagos
                            );

                          return (
                            <div
                              key={tatuaje.id}
                              className="rounded-xl border p-5"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="text-lg font-semibold">
                                    {tatuaje.nombre}
                                  </h4>

                                  <p className="text-sm">
                                    Estado:{" "}
                                    {tatuaje.estado}
                                  </p>

                                  {tatuaje.estilo && (
                                    <p className="text-sm text-muted-foreground">
                                      Estilo:{" "}
                                      {tatuaje.estilo}
                                    </p>
                                  )}

                                  {tatuaje.zona && (
                                    <p className="text-sm text-muted-foreground">
                                      Zona:{" "}
                                      {tatuaje.zona}
                                    </p>
                                  )}
                                </div>

                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    Precio
                                  </p>

                                  <p className="text-xl font-bold">
                                    {formatoMoneda(
                                      tatuaje.precio ?? 0
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-3 md:grid-cols-3">
                                <div className="rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">
                                    Total pagado
                                  </p>

                                  <p className="text-lg font-semibold">
                                    {formatoMoneda(
                                      totalPagado
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">
                                    Saldo pendiente
                                  </p>

                                  <p className="text-lg font-semibold">
                                    {formatoMoneda(
                                      saldo
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">
                                    Pagos registrados
                                  </p>

                                  <p className="text-lg font-semibold">
                                    {tatuaje.pagos.length}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5">
                                <h5 className="mb-3 font-semibold">
                                  Historial de pagos
                                </h5>

                                {tatuaje.pagos.length ===
                                0 ? (
                                  <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                                    No hay pagos registrados para este tatuaje.
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b text-left text-sm">
                                          <th className="px-3 py-3 font-medium">
                                            Fecha
                                          </th>

                                          <th className="px-3 py-3 font-medium">
                                            Método
                                          </th>

                                          <th className="px-3 py-3 font-medium">
                                            Concepto
                                          </th>

                                          <th className="px-3 py-3 text-right font-medium">
                                            Monto
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {tatuaje.pagos.map(
                                          (pago) => (
                                            <tr
                                              key={
                                                pago.id
                                              }
                                              className="border-b last:border-0"
                                            >
                                              <td className="px-3 py-3">
                                                {new Date(
                                                  pago.fecha
                                                ).toLocaleDateString(
                                                  "es-MX"
                                                )}
                                              </td>

                                              <td className="px-3 py-3">
                                                {nombreMetodo(
                                                  pago.metodo
                                                )}
                                              </td>

                                              <td className="px-3 py-3">
                                                {pago.concepto ||
                                                  "—"}
                                              </td>

                                              <td className="px-3 py-3 text-right font-semibold">
                                                {formatoMoneda(
                                                  pago.monto
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>
                )}
              </article>
            ))}
        </section>
      </div>
    </main>
  );
}
