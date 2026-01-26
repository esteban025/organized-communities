import { $id } from "@/utils/getElements";

export const warningMessage = async (title: string, message: string) => {
  const modalMsg = $id("modal-message") as HTMLDivElement;
  const $title = modalMsg.querySelector(".title-message") as HTMLHeadingElement;
  const $msg = modalMsg.querySelector(".text-message") as HTMLParagraphElement;

  $msg.textContent = message;
  $title.textContent = title;
  modalMsg.classList.add("show");

  // debemos devolver un true o false dependiendo de si el usuario
  // hizo click en aceptar o cancelar
  return new Promise<boolean>((resolve) => {
    const handleAccept = () => {
      cleanup();
      resolve(true);
    };
    const handleCancel = () => {
      cleanup();
      resolve(false);
    }
    const cleanup = () => {
      modalMsg.classList.remove("show");
      const btnAccept = modalMsg.querySelector(".btn-accept") as HTMLButtonElement;
      const btnCancel = modalMsg.querySelector(".btn-cancel") as HTMLButtonElement;
      btnAccept.removeEventListener("click", handleAccept);
      btnCancel.removeEventListener("click", handleCancel);
    }
    const btnAccept = modalMsg.querySelector(".btn-accept") as HTMLButtonElement;
    const btnCancel = modalMsg.querySelector(".btn-cancel") as HTMLButtonElement;
    btnAccept.addEventListener("click", handleAccept);
    btnCancel.addEventListener("click", handleCancel);
  });
}