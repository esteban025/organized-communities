import type { CommunityResume } from "@/types/communities"
import { EyeIcon, TrashIcon, EditIcon } from "@/icons/iconsReact"

export const TableCommunities = ({ communities }: { communities: CommunityResume[] }) => {
  const headTable = [
    'N° Com',
    'Responsable',
    'Paso',
    'Hermanos',
    'Acciones',
  ]

  const handleEditComm = (e: React.MouseEvent<HTMLButtonElement>, community: Partial<CommunityResume>) => {
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
          {communities.map(({ id, number_community, responsable, level_paso, count_persons }, idx) => (
            <tr key={id} className="animate-entry-table" style={{ animationDelay: `${idx * 100}ms` }}>
              <td className="min">{number_community}</td>
              <td>{responsable}</td>
              <td>{level_paso}</td>
              <td className="text-center">{count_persons}</td>
              <td className="min">
                <div className="flex items-center gap-1">
                  <a href={`/communities/${id}`} title="Ver Comunidad" className="atn-btn">
                    <EyeIcon className="size-5 block stroke-1" />
                  </a>
                  <button className="atn-btn" title="Editar Comunidad" onClick={(e) => handleEditComm(e, { id, number_community, level_paso })}>
                    <EditIcon className="size-5 block stroke-1" />
                  </button>
                  <button className="atn-btn" title="Eliminar Comunidad" onClick={() => handleDeleteComm(id)}>
                    <TrashIcon className="size-5 block stroke-1" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={5}>
              <div className="flex">
                Total de Comunidades: {communities.length}
              </div>
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}