import type { RetreatHouse } from "@/types/retreatHouses"

export const TableHospedajes = ({ hospedajes }: { hospedajes: RetreatHouse[] }) => {

  const headTable = [
    'Nombre',
    'Direccion',
    'Capacidad',
    'Acciones',
  ]
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-4 gap-4 p-2 border-b-2 border-neutral-300">
        {headTable.map((head) => (
          <div key={head} className="font-semibold text-neutral-700 text-center">
            {head}
          </div>
        ))}
      </div>
      {hospedajes.map(hosp => (
        <div
          key={hosp.id}
          className="grid grid-cols-4 gap-4 p-2 hover:bg-neutral-200 odd:bg-white even:bg-neutral-100 animate-entry-table"
          style={{ animationDelay: `${hosp.id * 100}ms` }}
        >
          <div className="">{hosp.name}</div>
          <div className="">{hosp.address}</div>
          <div className="">{hosp.max_capacity}</div>
          <div className="">acciones</div>

        </div>
      ))}
    </div>
  )
}