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
  precio: string | number | null;
  anticipo: string | number | null;
};

type Pago = {
  id: number;
  monto: string | number;
  fecha: string;
  metodo: string;
  concepto: string | null;
  notas: string | null;
  cliente: Cliente;
  tatuaje: Tatuaje | null;
  usuario: {
    id: number;
    nombre: string;
  } | null;
};

const metodos = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "OTRO", label: "Otro" },
];

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tatuajes, setTatuajes] = useState<Tatuaje[]>([]);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [tatuajeId, setTatuajeId] = useState("");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("EFECTIVO");
  const [concepto, setConcepto] = useState("");
  const [notas, setNotas] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [resPagos, resClientes, resTatuajes] =
        await Promise.all([
          fetch("/api/pagos"),
          fetch("/api/clientes"),
          fetch("/api/tatuajes"),
        ]);

      const datosPagos = await resPagos.json();
      const datosClientes = await resClientes.json();
      const datosTatuajes = await resTatuajes.json();

      if (
        !resPagos.ok ||
        !resClientes.ok ||
        !resTatuajes.ok
      ) {
        throw new Error(
          "No se pudieron cargar los datos."
        );
      }

      setPagos(datosPagos);
      setClientes(datosClientes);
      setTatuajes(datosTatuajes);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar los datos."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const tatuajesCliente = tatuajes.filter(
    (tatuaje: Tatuaje & { cliente?: Cliente }) =>
      !clienteId ||
      tatuaje.cliente?.id === Number(clienteId)
  );

  function limpiarFormulario() {
    setClienteId("");
    setTatuajeId("");
    setMonto("");
    setMetodo("EFECTIVO");
    setConcepto("");
    setNotas("");
    setError("");
  }

  async function registrarPago(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!clienteId) {
      setError("Selecciona un cliente.");
      return;
    }

    if (!monto || Number(monto) <= 0) {
      setError("El monto debe ser mayor a cero.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch("/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId,
          tatuajeId: tatuajeId || null,
          monto,
          metodo,
          concepto,
          notas,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            "No se pudo registrar el pago."
        );
        return;
      }

      setPagos((actuales) => [
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
          : "Error al registrar el pago."
      );
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
              Gestión financiera
            </p>

            <h1 className="text-3xl font-bold">
              Pagos
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
              Nuevo pago
            </button>
          )}
        </header>

        {mostrarFormulario && (
          <section className="rounded-xl border bg-background p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Registrar pago
              </h2>

              <p className="text-sm text-muted-foreground">
                Registra un pago del cliente y,
                opcionalmente, asígnalo a un tatuaje.
              </p>
            </div>

            <form
              onSubmit={registrarPago}
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
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="">
                      Seleccionar cliente
                    </option>

                    {clientes.map((cliente) => (
                      <option
                        key={cliente.id}
                        value={cliente.id}
                      >
                        {cliente.nombre} —{" "}
                        {cliente.telefono}
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
                      Pago general del cliente
                    </option>

                    {tatuajesCliente.map(
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
                    htmlFor="monto"
                    className="text-sm font-medium"
                  >
                    Monto *
                  </label>

                  <input
                    id="monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monto}
                    onChange={(event) =>
                      setMonto(event.target.value)
                    }
                    placeholder="0.00"
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="metodo"
                    className="text-sm font-medium"
                  >
                    Método de pago *
                  </label>

                  <select
                    id="metodo"
                    value={metodo}
                    onChange={(event) =>
                      setMetodo(event.target.value)
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    {metodos.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="concepto"
                    className="text-sm font-medium"
                  >
                    Concepto
                  </label>

                  <input
                    id="concepto"
                    type="text"
                    value={concepto}
                    onChange={(event) =>
                      setConcepto(event.target.value)
                    }
                    placeholder="Ej. Anticipo, sesión 2, pago final..."
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
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
                    placeholder="Notas adicionales"
                    className="min-h-24 w-full rounded-lg border bg-background px-3 py-2"
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
                    : "Registrar pago"}
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
          {cargando && (
            <div className="p-6 text-sm text-muted-foreground">
              Cargando pagos...
            </div>
          )}

          {!cargando && pagos.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">
              No hay pagos registrados.
            </div>
          )}

          {!cargando && pagos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm">
                    <th className="px-6 py-4 font-medium">
                      Fecha
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Cliente
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Tatuaje
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Método
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Concepto
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Monto
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pagos.map((pago) => (
                    <tr
                      key={pago.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-6 py-4">
                        {new Date(
                          pago.fecha
                        ).toLocaleDateString(
                          "es-MX"
                        )}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {pago.cliente.nombre}
                      </td>

                      <td className="px-6 py-4">
                        {pago.tatuaje?.nombre ||
                          "Pago general"}
                      </td>

                      <td className="px-6 py-4">
                        {pago.metodo}
                      </td>

                      <td className="px-6 py-4">
                        {pago.concepto || "—"}
                      </td>

                      <td className="px-6 py-4 font-semibold">
                        $
                        {Number(
                          pago.monto
                        ).toFixed(2)}
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
