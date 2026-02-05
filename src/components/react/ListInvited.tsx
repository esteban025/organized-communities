import { SendIcon, PlusIcon } from "@/icons/iconsReact";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import { FilterInvited } from "./FilterInvited";
import type { BrotherInvited } from "@/types/brothers";

const headTable = [
  "Asis.",
  "N° Com",
  "Nombres",
  "Estado Civil",
];

export const ListInvited = ({ retreatId }: { retreatId: number }) => {
  const [retreat, setRetreat] = useState<BrotherInvited[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRetreat = async () => {
      try {
        const { data, error } = await actions.getBrotherOfRetreatById({ id: retreatId });
        if (error) {
          setError("Error al cargar los invitados.");
        } else {
          setRetreat(data.data);
        }
        setLoading(false);
        console.log(retreat);
      } catch (error) {
        setError("Error al cargar los invitados.");
        setLoading(false);
      }
    }
    fetchRetreat();
  }, [retreatId])

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        {retreat && (
          <>
            <button className="btn btn-secondary flex items-center gap-2">
              <PlusIcon className="size-4 block" />
              <span>Invitar</span>
            </button>
            <div className="flex gap-4">
              <button className="hover:underline cursor-pointer">Marcar todos</button>
              <button className="btn btn-primary flex items-center gap-2">
                <SendIcon className="size-4 block" />
                <span>Confirmar</span>
              </button>
            </div>
          </>
        )}

      </header>

      {loading && <p className="message-card loading">Cargando invitados...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && retreat.length === 0 && (
        <p className="message-card ">
          No hay hermanos invitados para esta convivencia.
        </p>
      )}

      {!loading && !error && retreat.length > 0 && (
        <div className="flex flex-col">
          <FilterInvited />
          <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 p-2 border-b-2 border-neutral-300">
            {headTable.map((head) => (
              <div
                key={head}
                className="font-semibold text-neutral-700 text-center"
              >
                {head}
              </div>
            ))}
          </div>
          {retreat.map((person) => (
            <div
              key={person.id}
              className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 p-2 hover:bg-neutral-200 odd:bg-white even:bg-neutral-100 animate-entry-table"
            >
              <div className="min-w-10 text-center">
                <input type="checkbox" />
              </div>
              <div className="text-center">{person.number_community}</div>
              <div className="truncate">
                {person.names}
              </div>
              <div className="text-center">{person.civil_status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};