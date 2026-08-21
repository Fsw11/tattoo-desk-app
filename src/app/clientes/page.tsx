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
  creadoEn: string;
  fotos: Foto[];
  tatuajes: Tatuaje[];
};

export default function ClientesPage() {
  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [clienteAbierto, setClienteAbierto] =
    useState<number | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [error, setError] =
    useState("");

  const [nombre, setNombre] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [instagram, setInstagram] =
    useState("");

  async function cargarClientes() {
    try {
      setCargando(true);
      setError("");

      const respuesta =
        await fetch("/api/clientes");

      const datos =
        await respuesta.json();

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
          : "Error al cargar clientes."
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

    if (
      !nombre.trim() ||
      !telefono.trim()
    ) {
      setError(
        "El nombre y teléfono son obligatorios."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta =
        await fetch("/api/clientes", {
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

      const datos =
        await respuesta.json();

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
          : "Error al crear cliente."
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
    return Math.max(
      Number(precio ?? 0) -
      calcularTotalPagado(pagos),
      0
    );
  }

  function formatoMoneda(
    cantidad: string | number
  ) {
    return Number(
      cantidad
    ).toLocaleString(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
      }
    );
  }

  function nombreMetodo(
    metodo: string
  ) {
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

            <h2 className="mb-5 text-xl font-semibold">
              Nuevo cliente
            </h2>

            <form
              onSubmit={crearCliente}
              className="space-y-5"
            >

              <div className="grid gap-5 md:grid-cols-2">

                <input
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                  required
                />

                <input
                  placeholder="Teléfono"
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                  required
                />

                <input
                  placeholder="Correo"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                />

                <input
                  placeholder="Instagram"
                  value={instagram}
                  onChange={(e) =>
                    setInstagram(e.target.value)
                  }
                  className="rounded-lg border px-3 py-2"
                />

              </div>


              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-red-700">
                  {error}
                </div>
              )}


              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario();
                    setMostrarFormulario(false);
                  }}
                  className="rounded-lg border px-4 py-2"
                >
                  Cancelar
                </button>


                <button
                  disabled={guardando}
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar cliente"}
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


          {!cargando &&
            clientes.map((cliente) => (

              <article
                key={cliente.id}
                className="rounded-xl border bg-background p-5"
              >

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-xl font-semibold">
                      {cliente.nombre}
                    </h2>

                    <p>
                      {cliente.telefono}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {cliente.tatuajes.length} tatuaje(s)
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

                  <div className="mt-5 space-y-6 border-t pt-5">


                    <section>

                      <h3 className="text-lg font-semibold">
                        Galería del cliente
                      </h3>


                      {cliente.fotos.length === 0 ? (

                        <p className="mt-2 text-sm text-muted-foreground">
                          No hay fotos generales.
                        </p>

                      ) : (

                        <div className="mt-3 grid gap-4 md:grid-cols-4">

                          {cliente.fotos.map((foto) => (

                            <div
                              key={foto.id}
                              className="overflow-hidden rounded-lg border"
                            >

                              <img
                                src={foto.url}
                                alt={
                                  foto.descripcion ||
                                  "Foto del cliente"
                                }
                                className="h-40 w-full object-cover"
                              />

                              <div className="p-3">

                                <p className="font-medium">
                                  {foto.tipo}
                                </p>

                                {foto.descripcion && (
                                  <p className="text-sm text-muted-foreground">
                                    {foto.descripcion}
                                  </p>
                                )}

                              </div>

                            </div>

                          ))}

                        </div>

                      )}

                    </section>



                    <section>

                      <h3 className="text-lg font-semibold">
                        Tatuajes
                      </h3>
                      {cliente.tatuajes.length === 0 ? (

                        <p className="mt-3 text-sm text-muted-foreground">
                          No hay tatuajes registrados.
                        </p>

                      ) : (

                        cliente.tatuajes.map((tatuaje) => {

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
                              className="mt-5 rounded-xl border p-5"
                            >

                              <div className="flex justify-between">

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

                                  <p className="font-semibold">
                                    {formatoMoneda(
                                      totalPagado
                                    )}
                                  </p>
                                </div>


                                <div className="rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">
                                    Saldo pendiente
                                  </p>

                                  <p className="font-semibold">
                                    {formatoMoneda(
                                      saldo
                                    )}
                                  </p>
                                </div>


                                <div className="rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">
                                    Pagos
                                  </p>

                                  <p className="font-semibold">
                                    {tatuaje.pagos.length}
                                  </p>
                                </div>

                              </div>



                              <div className="mt-6">

                                <h5 className="font-semibold">
                                  Fotos del tatuaje
                                </h5>


                                {tatuaje.fotos.length === 0 ? (

                                  <p className="mt-2 text-sm text-muted-foreground">
                                    No hay fotos del tatuaje.
                                  </p>

                                ) : (

                                  <div className="mt-3 grid gap-4 md:grid-cols-4">

                                    {tatuaje.fotos.map((foto) => (

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

                                        </div>

                                      </div>

                                    ))}

                                  </div>

                                )}

                              </div>



                              <div className="mt-6">

                                <h5 className="mb-3 font-semibold">
                                  Historial de pagos
                                </h5>


                                {tatuaje.pagos.length === 0 ? (

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

                                        {tatuaje.pagos.map(
                                          (pago) => (

                                            <tr
                                              key={pago.id}
                                              className="border-b"
                                            >

                                              <td className="px-3 py-2">
                                                {new Date(
                                                  pago.fecha
                                                ).toLocaleDateString(
                                                  "es-MX"
                                                )}
                                              </td>


                                              <td className="px-3 py-2">
                                                {nombreMetodo(
                                                  pago.metodo
                                                )}
                                              </td>


                                              <td className="px-3 py-2">
                                                {pago.concepto || "—"}
                                              </td>


                                              <td className="px-3 py-2 text-right font-semibold">
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

                        })

                      )}

                    </section>


                  </div>

                )}

              </article>

            ))}

        </section>

      </div>
    </main>
  );
}
