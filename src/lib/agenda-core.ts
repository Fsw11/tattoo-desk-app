export function inicioDeSemana(fecha: Date) {
  const dia = fecha.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;

  const inicio = new Date(fecha);
  inicio.setDate(fecha.getDate() + diferencia);
  inicio.setHours(0, 0, 0, 0);

  return inicio;
}

export function sumarDias(fecha: Date, dias: number) {
  const nueva = new Date(fecha);
  nueva.setDate(fecha.getDate() + dias);
  return nueva;
}

export function formatoDia(fecha: Date) {
  return fecha.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
  });
}

export function parseHora(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export type HorarioDia = {
  diaSemana: number;
  abierto: boolean;
  horaInicio: string;
  horaFin: string;
};

export type Intervalo = {
  inicio: Date;
  fin: Date;
};

export function intervaloCita(fecha: Date, duracionMinutos: number): Intervalo {
  const inicio = new Date(fecha);
  const fin = new Date(fecha);
  fin.setMinutes(fin.getMinutes() + duracionMinutos);
  return { inicio, fin };
}

export function intervalosSeSolapan(a: Intervalo, b: Intervalo) {
  return a.inicio < b.fin && b.inicio < a.fin;
}

export function validarDentroDeHorario(
  fecha: Date,
  duracion: number,
  horarios: HorarioDia[],
): string | null {
  const dia = fecha.getDay();
  const horario = horarios.find((h) => h.diaSemana === dia);

  if (!horario || !horario.abierto) {
    return "El estudio está cerrado ese día.";
  }

  const minutosInicio = fecha.getHours() * 60 + fecha.getMinutes();
  const minutosFin = minutosInicio + duracion;
  const apertura = parseHora(horario.horaInicio);
  const cierre = parseHora(horario.horaFin);

  if (minutosInicio < apertura || minutosFin > cierre) {
    return `La cita debe estar entre ${horario.horaInicio} y ${horario.horaFin}.`;
  }

  return null;
}
