"use client";

import { FormEvent, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageShell from "@/components/ui/PageShell";
import Card from "@/components/ui/Card";

type Gasto = {
  id: number;
  concepto: string;
  descripcion: string | null;
  monto: string | number;
  fecha: string;
  categoria: string;
  notas: string | null;
  usuario: {
    id: number;
    nombre: string;
  } | null;
};

const categorias = [
  { value: "MATERIAL", label: "Material" },
  { value: "EQUIPO", label: "Equipo" },
  { value: "RENTA", label: "Renta" },
  { value: "SERVICIOS", label: "Servicios" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OTRO", label: "Otro" },
];

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [concepto, setConcepto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("MATERIAL");
  const [notas, setNotas] = useState("");

  async function cargarGastos() {
    try {
      setCargando(true);
      const respuesta = await fetch("/api/gastos");
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudieron cargar los gastos.");
      }
      setGastos(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarGastos();
  }, []);

  function limpiarFormulario() {
    setConcepto("");
    setDescripcion("");
    setMonto("");
    setCategoria("MATERIAL");
    setNotas("");
    setError("");
  }

  async function crearGasto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setGuardando(true);
      setError("");
      const respuesta = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto,
          descripcion,
          monto,
          categoria,
          notas,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo crear el gasto.");
      }
      setGastos((actuales) => [datos, ...actuales]);
      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const totalGastos = gastos.reduce(
    (total, gasto) => total + Number(gasto.monto),
    0,
  );

  return (
    <PageShell
      title="Gastos"
      description="Gastos operativos del estudio"
      actions={
        <Button
          onClick={() => {
            limpiarFormulario();
            setMostrarFormulario(true);
          }}
        >
          Nuevo gasto
        </Button>
      }
    >
      <Card>
        <p className="text-sm text-muted-foreground">
          Total de gastos registrados
        </p>
        <p className="text-3xl font-bold">
          $
          {totalGastos.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}
        </p>
      </Card>

      {error && !mostrarFormulario && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <section className="rounded-[var(--radius)] border border-border bg-card">
        {cargando ? (
          <div className="p-6 text-sm text-muted-foreground">
            Cargando gastos...
          </div>
        ) : gastos.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No hay gastos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm">
                  <th className="px-5 py-3 font-medium">Concepto</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="border-b text-sm">
                    <td className="px-5 py-3">{gasto.concepto}</td>
                    <td className="px-5 py-3">{gasto.categoria}</td>
                    <td className="px-5 py-3">
                      {new Date(gasto.fecha).toLocaleDateString("es-MX")}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      ${Number(gasto.monto).toLocaleString("es-MX")}
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
        title="Registrar gasto"
      >
        <form onSubmit={crearGasto} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
            />
            <Input
              label="Monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
            <Select
              label="Categoría"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {categorias.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <Input
            label="Notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
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
              {guardando ? "Guardando..." : "Guardar gasto"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
