"use client";

import { claseEstadoCita, topDesdeHora, alturaDesdeDuracion, type CitaAgenda } from "./types";

export default function CitaBlock({
  cita,
  onClick,
}: {
  cita: CitaAgenda;
  onClick: (cita: CitaAgenda) => void;
}) {
  const inicio = new Date(cita.fecha);
  const top = topDesdeHora(inicio);
  const height = alturaDesdeDuracion(cita.duracion);

  return (
    <button
      type="button"
      onClick={() => onClick(cita)}
      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border px-2 py-1 text-left text-xs shadow-sm transition hover:brightness-110 ${claseEstadoCita(cita.estado)}`}
      style={{ top, height }}
    >
      <p className="truncate font-semibold">
        {inicio.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        · {cita.cliente.nombre}
      </p>
      <p className="truncate opacity-80">
        {cita.tatuaje?.nombre || cita.motivo || "Sin tatuaje"}
      </p>
    </button>
  );
}
