import { EditIcon, TrashIcon, UserIcon } from "@/icons/iconsReact";
import type { BrotherwithRolesOutDB, TotalsBrothers } from "@/types/brothers";

export const TableBrothers = ({ brothers, totals }: { brothers: BrotherwithRolesOutDB[], totals: TotalsBrothers }) => {
  console.log(brothers)
  const headTable = [
    'Nombres',
    'Roles',
    // 'Teléfono',
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
    <div className="container-table">
      <table>
        <thead>
          <tr>
            {headTable.map((item) => (
              <th key={item}>{item}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brothers.map((bro, idx) => (
            <tr key={bro.group_id} className="animate-entry-table" style={{ animationDelay: `${idx * 100}ms` }}>
              <td>{bro.names}</td>
              <td className="">
                <div className="flex items-center gap-1 ">
                  {bro.roles?.map((rol) => (
                    <p className="tag-rol">{rol}</p>
                  ))}
                </div>
              </td>
              {/* <td>Telefono</td> */}
              <td>{bro.civil_status}</td>
              <td className="min overflow-visible">
                <div className="flex items-center justify-center gap-1 relative">
                  {
                    bro.civil_status === "matrimonio" && (
                      <>

                        <button
                          type="button"
                          title="Editar Esposo"
                          className="atn-btn"
                          onClick={() => handleEditBrother(bro.person1_id)}
                        >
                          <UserIcon className="size-6 block" genre="masc" />
                        </button>
                        <button
                          type="button"
                          title="Editar Esposa"
                          className="atn-btn"
                          onClick={() => handleEditBrother(bro.person2_id)}
                        >
                          <UserIcon className="size-6 block" genre="fem" />
                        </button>

                        <button className="atn-btn" onClick={() => handleDeleteBrother([bro.person1_id, bro.person2_id])} title="Eliminar hermano">
                          <TrashIcon className="size-5 icon-btn" />
                        </button>
                      </>
                    )
                  }
                  {bro.civil_status !== "matrimonio" && (
                    <>
                      <button
                        type="button"
                        className="atn-btn"
                        title="Editar hermano"
                        onClick={() => handleEditBrother(bro.person_id)}
                      >
                        <EditIcon className="size-5 icon-btn" />
                      </button>
                      <button
                        type="button"
                        className="atn-btn"
                        title="Eliminar hermano"
                        onClick={() => handleDeleteBrother([bro.person_id])}
                      >
                        <TrashIcon className="size-5 icon-btn" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          <tr className="tr-foot">
            <th colSpan={4}>
              <div className="flex items-center gap-4 justify-around">
                <p>Total hermanos: {totals.total_personas}</p>
                <p>Total matrimonios: {totals.total_matrimonios}</p>
                <p>Total solteros: {totals.total_solteros}</p>
                <p>Total solteras: {totals.total_solteras}</p>
              </div>
            </th>
          </tr>
        </tbody>
      </table>
    </div>
  )
}