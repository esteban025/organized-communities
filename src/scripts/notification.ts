import { $id } from "@/utils/getElements";

export function showNotification(
  message: string,
  type: "success" | "error" | "info" = "info",
  duration: number = 3000
) {
  const notification = $id("notification") as HTMLDivElement;
  const messageElement = notification?.querySelector(
    ".notification-message"
  ) as HTMLParagraphElement;

  if (!notification || !messageElement) return;

  // Limpiar clases anteriores
  notification.classList.remove("success", "error", "info", "hide");

  // Establecer mensaje y tipo
  messageElement.textContent = message;
  notification.classList.add(type);

  // Mostrar notificación
  notification.classList.remove("hidden");
  notification.classList.add("show");

  // Ocultar después de la duración especificada
  setTimeout(() => {
    notification.classList.add("hide");
    notification.classList.remove("show", "hide");
    notification.classList.add("hidden");
  }, duration);
}
