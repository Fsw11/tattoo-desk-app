"use client";

import {
  HORA_FIN,
  HORA_INICIO,
  PX_POR_MINUTO,
  type CitaAgenda,
} from "./types";
import CitaBlock from "./CitaBlock";

const horas = Array.from(
  { length: HORA_FIN - HORA_INICIO },
  (_, i) => HORA_INICIO + i,
);

export default function DayTimeline({
  fecha,
  citas,
  onSlotClick,
  onCitaClick,
}: {
  fecha: Date;
  citas: CitaAgenda[];
  onSlotClick: (fecha: Date, hora: string) => void;
  onCitaClick: (cita: CitaAgenda) => void;
}) {
  const alto = (HORA_FIN - HORA_INICIO) * 60 * PX_POR_MINUTO;
  const delDia = citas.filter((c) => {
    const f = new Date(c.fecha);
    return (
      f.getFullYear() === fecha.getFullYear() &&
      f.getMonth() === fecha.getMonth() &&
      f.getDate() === fecha.getDate() &&
      c.estado !== "CANCELADA"
    );
  });

  return (
    <div className="overflow-auto rounded-[var(--radius)] border border-border bg-card">
      <div className="relative flex" style={{ minHeight: alto }}>
        <div className="w-14 shrink-0 border-r border-border bg-muted/30">
          {horas.map((h) => (
            <div
              key={h}
              className="border-b border-border/60 px-1 text-[11px] text-muted-foreground"
              style={{ height: 60 * PX_POR_MINUTO }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {horas.map((h) => (
            <button
              key={h}
              type="button"
              className="absolute left-0 right-0 border-b border-border/40 hover:bg-muted/40"
              style={{
                top: (h - HORA_INICIO) * 60 * PX_POR_MINUTO,
                height: 60 * PX_POR_MINUTO,
              }}
              onClick={() =>
                onSlotClick(fecha, `${String(h).padStart(2, "0")}:00`)
              }
              aria-label={`Crear cita a las ${h}:00`}
            />
          ))}
          {delDia.map((cita) => (
            <CitaBlock key={cita.id} cita={cita} onClick={onCitaClick} />
          ))}
        </div>
      </div>
    </div>
  );
}
