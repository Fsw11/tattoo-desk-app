export type CitaAgenda = {
  id: string;
  fecha: string;
  duracion: number;
  motivo: string | null;
  notas: string | null;
  estado: "PENDIENTE" | "CONFIRMADA" | "FINALIZADA" | "CANCELADA";
  clienteId: string;
  tatuajeId: string | null;
  cliente: { id: string; nombre: string; telefono: string };
  tatuaje: {
    id: string;
    nombre: string;
    estado: string;
    precio: string | number | null;
    zona: string | null;
    estilo: string | null;
  } | null;
  usuario: { id: number; nombre: string } | null;
};

export const HORA_INICIO = 8;
export const HORA_FIN = 22;
export const PX_POR_MINUTO = 1.2;

export function minutosDesdeMedianoche(fecha: Date) {
  return fecha.getHours() * 60 + fecha.getMinutes();
}

export function topDesdeHora(fecha: Date) {
  const mins = minutosDesdeMedianoche(fecha) - HORA_INICIO * 60;
  return Math.max(0, mins * PX_POR_MINUTO);
}

export function alturaDesdeDuracion(duracion: number) {
  return Math.max(28, duracion * PX_POR_MINUTO);
}

export function claseEstadoCita(estado: string) {
  switch (estado) {
    case "CONFIRMADA":
      return "border-success/40 bg-success/20 text-success";
    case "FINALIZADA":
      return "border-primary/40 bg-primary/20 text-primary";
    case "CANCELADA":
      return "border-danger/40 bg-danger/15 text-danger opacity-60";
    default:
      return "border-warning/40 bg-warning/20 text-warning";
  }
}

export function isoLocalDesdeFechaYHora(fechaDia: Date, hora: string) {
  const [h, m] = hora.split(":").map(Number);
  const d = new Date(fechaDia);
  d.setHours(h || 0, m || 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
