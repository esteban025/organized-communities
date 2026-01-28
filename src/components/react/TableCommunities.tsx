import type { CommunityWithBrotherCount } from "@/types/communities"
import { EyeIcon, TrashIcon, EditIcon } from "@/icons/iconsReact"

export const TableCommunities = ({ communities }: { communities: CommunityWithBrotherCount[] }) => {
  const headTable = [
    'Numero',
    'Responsable',
    'Paso',
    'Hermanos',
    'Acciones',
  ]

  const handleEditComm = (e: React.MouseEvent<HTMLButtonElement>, community: Partial<CommunityWithBrotherCount>) => {
    e.preventDefault()
    if (typeof (window as any).editCommunity === "function") {
      (window as any).editCommunity(community)
    } else {
      console.warn("editCommunity function is not defined on window")
    }
  }
  const handleDeleteComm = (id: number) => {
    if (typeof (window as any).deleteCommunity === "function") {
      (window as any).deleteCommunity(id)
    } else {
      console.warn("deleteCommunity function is not defined on window")
    }
  }
  console.log(communities)
  return (
    <>
      {
        communities.length > 0 ? (
          <div className="flex flex-col">
            <div className="grid grid-cols-[80px_2fr_2fr_2fr_1fr] gap-4 p-2 border-b-2 border-neutral-300">
              {headTable.map((head) => (
                <div key={head} className="font-semibold text-neutral-700 text-center">
                  {head}
                </div>
              ))}
            </div>
            {communities.map(({ id, number_community, responsable, level_paso, count_persons }) => (
              <div
                key={id}
                className="grid grid-cols-[80px_2fr_2fr_2fr_1fr] gap-4 p-2 hover:bg-neutral-200 odd:bg-white even:bg-neutral-100 animate-entry-table"
                style={{ animationDelay: `${id * 100}ms` }}
              >
                <div className="text-center">{number_community}</div>
                <div className="">{responsable ? responsable : "--"}</div>
                <div className="">{level_paso ? level_paso : "--"}</div>
                <div className="text-center">{count_persons}</div>
                <div className="actions flex justify-center gap-2">
                  <a href={`/communities/${id}`} title="Ver Comunidad" className="atn-btn">
                    <EyeIcon className="size-5 block stroke-1" />
                  </a>
                  <button className="atn-btn" title="Editar Comunidad" onClick={(e) => handleEditComm(e, { id, number_community, responsable, level_paso })}>
                    <EditIcon className="size-5 block stroke-1" />
                  </button>
                  <button className="atn-btn" title="Eliminar Comunidad" onClick={() => handleDeleteComm(id)}>
                    <TrashIcon className="size-5 block stroke-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center p-4">No hay comunidades disponibles.</p>
        )
      }
    </>

  )
}