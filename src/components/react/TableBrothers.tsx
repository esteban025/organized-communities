import { EditIcon, TrashIcon } from "@/icons/iconsReact";
import type { BrotherwithRolesOutDB } from "@/types/brothers";
import { useState } from "react";

export const TableBrothers = ({ brothers }: { brothers: BrotherwithRolesOutDB[] }) => {
  const headTable = [
    'Nombres',
    'Roles',
    'Estado Civil',
    'Acciones',
  ];

  const handleDeleteBrother = (ids: (number | null)[]) => {
    const cleanIds = ids.filter((id): id is number => typeof id === "number");
    if (cleanIds.length === 0) return;
    const anyWindow = window as any;
    if (typeof anyWindow.deleteBrother === "function") {
      anyWindow.deleteBrother(cleanIds);
    } else {
      console.warn("deleteBrother function is not defined on window");
    }
  };

  const handleEditBrother = (brotherId: number | null) => {
    if (brotherId === null) return;
    const anyWindow = window as any;
    if (typeof anyWindow.editBrother === "function") {
      anyWindow.editBrother(brotherId);
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
                <>
                  <div
                    className="atn-btn group"
                    title="Editar hermano"
                  >
                    <EditIcon className="size-5 icon-btn" />
                    <ul className="absolute top-full right-0 bg-white border border-neutral-300 shadow-lg mt-1 z-100 min-w-25 rounded-lg flex flex-col opacity-0 scale-0 origin-top-right group-hover:opacity-100 group-hover:scale-100 transition-all">
                      <button
                        type="button"
                        className=" w-full text-xs cursor-pointer hover:bg-neutral-100 py-2"
                        onClick={() => handleEditBrother(brother.person1_id)}
                      >
                        H
                      </button>
                      <button
                        type="button"
                        className="w-full text-xs cursor-pointer hover:bg-neutral-100 py-2"
                        onClick={() => handleEditBrother(brother.person2_id)}
                      >
                        M
                      </button>
                    </ul>
                  </div>
                  <button className="atn-btn" onClick={() => handleDeleteBrother([brother.person1_id, brother.person2_id])} title="Eliminar hermano">
                    <TrashIcon className="size-5 icon-btn" />
                  </button>
                </>
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
                  onClick={() => handleDeleteBrother([brother.person_id])}
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