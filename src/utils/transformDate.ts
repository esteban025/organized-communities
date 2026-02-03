export const transformDate = (dateString: string): string => {
  // Jun 12
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return date.toLocaleDateString("es-ES", options);
}