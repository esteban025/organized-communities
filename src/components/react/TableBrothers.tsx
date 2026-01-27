import type { BrotherwithRoles } from "@/types/brothers";

export const TableBrothers = ({ brothers }: { brothers: BrotherwithRoles[] }) => {
  const headTable = [
    'Nombres',
    'Roles',
    'Estado Civil',
    'Teléfono',
    'Acciones',
  ];
  console.log(brothers);
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-5 gap-4 p-2 border-b-2 border-neutral-300">
        {headTable.map((head) => (
          <div key={head} className="font-semibold text-neutral-700 text-center">
            {head}
          </div>
        ))}
      </div>
      {brothers.map((brother) => (
        <div key={brother.id} className="grid grid-cols-5 gap-4 p-2 hover:bg-neutral-200 odd:bg-white even:bg-neutral-100">
          <div className="name truncate">{brother.names}</div>
          <div className="roles text-center">{brother.roles || "--"}</div>
          <div className="civil-status text-center">{brother.civil_status}</div>
          <div className="phone text-center">{brother.phone || "--"}</div>
          <div className="actions">actiones</div>
        </div>
      ))}
    </div>
  )
}