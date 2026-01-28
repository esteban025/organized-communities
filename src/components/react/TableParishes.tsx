import { EditIcon, EyeIcon, TrashIcon } from "@/icons/iconsReact"
import type { ParishWithCounts } from "@/types/parishes"

export const TableParishes = ({ parishes }: { parishes: ParishWithCounts[] }) => {
  const headTable = [
    'Nombre',
    'Tag',
    'Localidad',
    'Comunidades',
    'Acciones',
  ]

  const handleEditParish = (e: React.MouseEvent<HTMLButtonElement>, parish: ParishWithCounts) => {
    e.preventDefault()
    const anyWindow = window as any
    if (typeof anyWindow.fillOutParishForm === "function") {
      anyWindow.fillOutParishForm(parish)
    } else {
      console.warn("fillOutParishForm function is not defined on window")
    }
  }

  const handleDeleteParish = (parishId: number) => {
    const anyWindow = window as any
    if (typeof anyWindow.deleteParish === "function") {
      anyWindow.deleteParish(parishId)
    } else {
      console.warn("deleteParish function is not defined on window")
    }
  }
  console.log(parishes)

  return (
    <>
      {parishes.length === 0 && (
        <div className="message-card flex-1">No hay parroquias disponibles.</div>
      )}
      {parishes.length > 0 && (
        <div className="flex flex-col">
          <div className="grid grid-cols-5 gap-4 p-2 border-b-2 border-neutral-300">
            {headTable.map((head) => (
              <div key={head} className="font-semibold text-neutral-700 text-center">
                {head}
              </div>
            ))}
          </div>
          {parishes.map((parish) => (
            <div
              key={parish.id}
              className="grid grid-cols-5 gap-4 p-2 hover:bg-neutral-200 odd:bg-white even:bg-neutral-100 animate-entry-table"
              style={{ animationDelay: `${parish.id * 100}ms` }}
            >
              <div className="font-semibold">{parish.name}</div>
              <div className="text-center text-neutral-500">({parish.tag})</div>
              <div className="location">{parish.locality ? parish.locality : "N/A"}</div>
              <div className="text-center">{parish.count_communities}</div>
              <div className="actions flex justify-center gap-2">
                <a href={`/parishes/${parish.id}`} title="Ver Parroquia" className="atn-btn">
                  <EyeIcon className="size-5 block stroke-1" />
                </a>
                <button className="atn-btn" title="Editar Parroquia" onClick={(e) => handleEditParish(e, parish)}>
                  <EditIcon className="size-5 block stroke-1" />
                </button>
                <button className="atn-btn" title="Eliminar Parroquia" onClick={() => handleDeleteParish(parish.id)}>
                  <TrashIcon className="size-5 block stroke-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}