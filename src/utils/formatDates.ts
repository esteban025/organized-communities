const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

export function formatConvivenciaRange(
  start: string | Date,
  end: string | Date,
): string {
  const startDate = toDate(start);
  const endDate = toDate(end);

  const diaInicio = startDate.getDate();
  const diaFin = endDate.getDate();
  const mes = MESES[endDate.getMonth()];
  const anio = endDate.getFullYear();

  return `Del ${diaInicio} al ${diaFin} de ${mes} del ${anio}`;
}

export function formatTodayLong(): string {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = MESES[hoy.getMonth()];
  const anio = hoy.getFullYear();

  return `${dia} de ${mes} del ${anio}`;
}
