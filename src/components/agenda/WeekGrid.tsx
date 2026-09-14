"use client";

import { sumarDias, inicioDeSemana, formatoDia } from "@/lib/agenda-core";
import DayTimeline from "./DayTimeline";
import type { CitaAgenda } from "./types";

export default function WeekGrid({
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
  const inicio = inicioDeSemana(fecha);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));

  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-7 lg:gap-2">
      {dias.map((dia) => (
        <div key={dia.toISOString()} className="min-w-0">
          <p className="mb-2 text-center text-sm font-semibold capitalize">
            {formatoDia(dia)}
          </p>
          <div className="max-h-[70vh] overflow-auto">
            <DayTimeline
              fecha={dia}
              citas={citas}
              onSlotClick={onSlotClick}
              onCitaClick={onCitaClick}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
