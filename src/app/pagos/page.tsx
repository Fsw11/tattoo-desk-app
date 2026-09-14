"use client";

import { FormEvent, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageShell from "@/components/ui/PageShell";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
};

type Tatuaje = {
  id: string;
  nombre: string;
  precio: string | number | null;
  anticipo: string | number | null;
  cliente?: { id: string };
};

type Pago = {
  id: string;
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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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
      const [resPagos, resClientes, resTatuajes] = await Promise.all([
        fetch("/api/pagos"),
        fetch("/api/clientes/select"),
        fetch("/api/tatuajes"),
      ]);
      const datosPagos = await resPagos.json();
      const datosClientes = await resClientes.json();
      const datosTatuajes = await resTatuajes.json();
      if (!resPagos.ok || !resClientes.ok || !resTatuajes.ok) {
        throw new Error("No se pudieron cargar los datos.");
      }
      setPagos(datosPagos);
      setClientes(datosClientes);
      setTatuajes(datosTatuajes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarDatos();
  }, []);

  const tatuajesCliente = tatuajes.filter(
    (tatuaje) => !clienteId || tatuaje.cliente?.id === clienteId,
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

  async function registrarPago(event: FormEvent<HTMLFormElement>) {
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
        headers: { "Content-Type": "application/json" },
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
        setError(datos.error || "No se pudo registrar el pago.");
        return;
      }
      setPagos((actuales) => [datos, ...actuales]);
      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PageShell
      title="Pagos"
      description="Registro de cobros (también disponible en POS)"
      actions={
        <Button
          onClick={() => {
            setError("");
            setMostrarFormulario(true);
          }}
        >
          Nuevo pago
        </Button>
      }
    >
      {error && !mostrarFormulario && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <section className="rounded-[var(--radius)] border border-border bg-card">
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
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Tatuaje</th>
                  <th className="px-6 py-4 font-medium">Método</th>
                  <th className="px-6 py-4 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-b text-sm">
                    <td className="px-6 py-4">
                      {new Date(pago.fecha).toLocaleString("es-MX")}
                    </td>
                    <td className="px-6 py-4">{pago.cliente?.nombre}</td>
                    <td className="px-6 py-4">
                      {pago.tatuaje?.nombre || "—"}
                    </td>
                    <td className="px-6 py-4">{pago.metodo}</td>
                    <td className="px-6 py-4 font-medium">
                      ${Number(pago.monto).toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={mostrarFormulario}
        onClose={() => {
          limpiarFormulario();
          setMostrarFormulario(false);
        }}
        title="Registrar pago"
        size="lg"
      >
        <form onSubmit={registrarPago} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Cliente"
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setTatuajeId("");
              }}
              required
            >
              <option value="">Selecciona...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Select
              label="Tatuaje (opcional)"
              value={tatuajeId}
              onChange={(e) => setTatuajeId(e.target.value)}
            >
              <option value="">Ninguno</option>
              {tatuajesCliente.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Select>
            <Input
              label="Monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
            <Select
              label="Método"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
            >
              {metodos.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Input
              label="Concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="sm:col-span-2"
            />
            <Input
              label="Notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="sm:col-span-2"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                limpiarFormulario();
                setMostrarFormulario(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Registrar pago"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
