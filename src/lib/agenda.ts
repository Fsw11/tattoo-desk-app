export function inicioDeSemana(fecha: Date) {
  const dia = fecha.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;

  const inicio = new Date(fecha);
  inicio.setDate(fecha.getDate() + diferencia);
  inicio.setHours(0, 0, 0, 0);

  return inicio;
}

export function sumarDias(
  fecha: Date,
  dias: number
) {
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
