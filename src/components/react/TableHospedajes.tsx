import { EditIcon, TrashIcon } from "@/icons/iconsReact"
import type { RetreatHouse } from "@/types/retreatHouses"

export const TableHospedajes = ({ hospedajes }: { hospedajes: RetreatHouse[] }) => {

  const headTable = [
    'Nombre',
    'Direccion',
    'Capacidad',
    'Acciones',
  ]
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
          {hospedajes.map((hosp) => (
            <tr key={hosp.id}>
              <td>{hosp.name}</td>
              <td>{hosp.address}</td>
              <td>{hosp.max_capacity}</td>
              <td className="min">
                <div className="flex items-center justify-center gap-1">
                  <button className="atn-btn" title="Editar hospedaje" onClick={() => (window as any).fillOutHospedajesForm(hosp)}>
                    <EditIcon className="size-5 block" />
                  </button>
                  <button className="atn-btn" title="Eliminar hospedaje" onClick={() => (window as any).deleteHospedaje(hosp.id)}>
                    <TrashIcon className="size-5 block" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}