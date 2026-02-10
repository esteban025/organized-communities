import { EditIcon, EyeIcon, TrashIcon } from "@/icons/iconsReact"
import type { ParishWithCounts } from "@/types/parishes"

interface TableParishesProps {
  parishes: ParishWithCounts[]
  total: {
    total_parishes: number
    total_communities: number
  }
}

export const TableParishes = ({ parishes, total }: TableParishesProps) => {
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

  return (
    <div className="container-table">
      <table>
        <thead>
          <tr>
            {headTable.map(item => (
              <th key={item}>{item}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parishes.map((parish, idx) => (
            <tr key={parish.id} className="animate-entry-table" style={{ animationDelay: `${idx * 120}ms` }}>
              <td>{parish.name}</td>
              <td className="">{parish.tag}</td>
              <td>{parish.locality}</td>
              <td className="min">{parish.count_communities}</td>
              <td className="min">
                <div className="flex items-center gap-1">
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
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={6}>
              <div className="flex items-center justify-around">
                <span>Parroquias: {parishes.length} / {total.total_parishes}</span>
                <span>Comunidades: {total.total_communities}</span>
              </div>
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}