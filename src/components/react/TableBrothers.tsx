import { EditIcon, TrashIcon } from "@/icons/iconsReact";
import type { BrotherwithRolesOutDB } from "@/types/brothers";

export const TableBrothers = ({ brothers }: { brothers: BrotherwithRolesOutDB[] }) => {
  const headTable = [
    'Nombres',
    'Roles',
    'Estado Civil',
    'Acciones',
  ];

  const handleDeleteBrother = (id: number) => {
    const anyWindow = window as any;
    if (typeof anyWindow.deleteBrother === "function") {
      anyWindow.deleteBrother(id);
    } else {
      console.warn("deleteBrother function is not defined on window");
    }
  };

  const handleEditBrother = (id: number) => {
    const anyWindow = window as any;
    if (typeof anyWindow.editBrother === "function") {
      anyWindow.editBrother(id);
    } else {
      console.warn("editBrother function is not defined on window");
    }
  };
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-4 gap-4 p-2 border-b-2 border-neutral-300">
        {headTable.map((head) => (
          <div key={head} className="font-semibold text-neutral-700 text-center">
            {head}
          </div>
        ))}
      </div>
      {brothers.map((brother) => (
        <div key={brother.group_id} className="grid grid-cols-4 gap-4 p-2 hover:bg-neutral-200 odd:bg-white even:bg-neutral-100">
          <div className="name truncate">{brother.names}</div>
          <div className="roles text-center flex items-center flex-wrap gap-1">
            {
              brother.roles?.map((role, index) => (
                <span key={index} className="tag-rol">
                  {role}
                </span>
              ))
            }
          </div>
          <div className="civil-status text-center">{brother.civil_status}</div>

          <div className="actions flex justify-center gap-1">
            {
              brother.civil_status === "matrimonio" && (
                // logica para poder eliminar, editar a uno de los dos
                <span>edit / delete married</span>
              )
            }

            {brother.civil_status !== "matrimonio" && (
              <>
                <button
                  type="button"
                  className="atn-btn"
                  title="Editar hermano"
                  onClick={() => handleEditBrother(brother.person_id)}
                >
                  <EditIcon className="size-5 icon-btn" />
                </button>
                <button
                  type="button"
                  className="atn-btn"
                  title="Eliminar hermano"
                  onClick={() => handleDeleteBrother(brother.person_id)}
                >
                  <TrashIcon className="size-5 icon-btn" />
                </button>
              </>

            )}

          </div>
        </div>
      ))}
    </div>
  )
}