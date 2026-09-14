"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DayTimeline from "@/components/agenda/DayTimeline";
import WeekGrid from "@/components/agenda/WeekGrid";
import CitaFormModal from "@/components/agenda/CitaFormModal";
import type { CitaAgenda } from "@/components/agenda/types";
import { sumarDias } from "@/lib/agenda-core";

type Vista = "DIA" | "SEMANA" | "MES";

export default function CitasPage() {
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vista, setVista] = useState<Vista>("DIA");
  const [fechaActual, setFechaActual] = useState(() => new Date());
  const [modalAbierto, setModalAbierto] = useState(false);
  const [slotInicial, setSlotInicial] = useState<{
    fecha: Date;
    hora: string;
  } | null>(null);
  const [editando, setEditando] = useState<CitaAgenda | null>(null);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const res = await fetch("/api/citas", { cache: "no-store" });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "Error al cargar citas");
      setCitas(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const titulo = useMemo(() => {
    return fechaActual.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [fechaActual]);

  function mover(dir: number) {
    if (vista === "DIA") setFechaActual(sumarDias(fechaActual, dir));
    else if (vista === "SEMANA") setFechaActual(sumarDias(fechaActual, dir * 7));
    else {
      const n = new Date(fechaActual);
      n.setMonth(n.getMonth() + dir);
      setFechaActual(n);
    }
  }

  function abrirEdicion(cita: CitaAgenda) {
    setEditando(cita);
    setSlotInicial(null);
    setModalAbierto(true);
  }

  function abrirNueva(fecha?: Date, hora?: string) {
    setEditando(null);
    setSlotInicial(fecha && hora ? { fecha, hora } : null);
    setModalAbierto(true);
  }

  const diasMes = useMemo(() => {
    const y = fechaActual.getFullYear();
    const m = fechaActual.getMonth();
    const primero = new Date(y, m, 1);
    const offset = (primero.getDay() + 6) % 7;
    const total = new Date(y, m + 1, 0).getDate();
    const celdas: Array<Date | null> = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) celdas.push(new Date(y, m, d));
    return celdas;
  }, [fechaActual]);

  return (
    <PageShell
      title="Agenda"
      description={titulo}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFechaActual(new Date())}
          >
            Hoy
          </Button>
          <Button onClick={() => abrirNueva()}>Nueva cita</Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => mover(-1)}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => mover(1)}>
          Siguiente
        </Button>
        {(["DIA", "SEMANA", "MES"] as Vista[]).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={vista === v ? "primary" : "outline"}
            onClick={() => setVista(v)}
          >
            {v === "DIA" ? "Día" : v === "SEMANA" ? "Semana" : "Mes"}
          </Button>
        ))}
      </div>

      {error && (
        <p className="rounded-[var(--radius)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando agenda...</p>
      ) : vista === "DIA" ? (
        <DayTimeline
          fecha={fechaActual}
          citas={citas}
          onSlotClick={(fecha, hora) => abrirNueva(fecha, hora)}
          onCitaClick={abrirEdicion}
        />
      ) : vista === "SEMANA" ? (
        <WeekGrid
          fecha={fechaActual}
          citas={citas}
          onSlotClick={(fecha, hora) => abrirNueva(fecha, hora)}
          onCitaClick={abrirEdicion}
        />
      ) : (
        <Card>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {diasMes.map((dia, i) => {
              if (!dia) return <div key={`e-${i}`} className="min-h-16" />;
              const count = citas.filter((c) => {
                const f = new Date(c.fecha);
                return (
                  f.toDateString() === dia.toDateString() &&
                  c.estado !== "CANCELADA"
                );
              }).length;
              return (
                <button
                  key={dia.toISOString()}
                  type="button"
                  onClick={() => {
                    setFechaActual(dia);
                    setVista("DIA");
                  }}
                  className="min-h-16 rounded-lg border border-border p-1 text-left hover:bg-muted"
                >
                  <span className="text-sm font-medium">{dia.getDate()}</span>
                  {count > 0 && (
                    <p className="mt-1 text-[11px] text-primary">
                      {count} cita{count > 1 ? "s" : ""}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <CitaFormModal
        open={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setEditando(null);
          setSlotInicial(null);
        }}
        iniciales={{
          fecha: slotInicial?.fecha,
          hora: slotInicial?.hora,
          cita: editando,
        }}
        onSaved={(cita) => {
          setCitas((prev) => {
            const sin = prev.filter((c) => c.id !== cita.id);
            return [...sin, cita].sort(
              (a, b) =>
                new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
            );
          });
          setEditando(cita);
        }}
      />
    </PageShell>
  );
}
