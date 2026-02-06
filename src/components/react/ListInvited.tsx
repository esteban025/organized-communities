import { SendIcon, PlusIcon, CheckIcon } from "@/icons/iconsReact";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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
    };

    fetchRetreat();

    const handleAttendanceUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ retreat_id?: number }>;
      const eventRetreatId = customEvent.detail?.retreat_id;
      // Si viene un id distinto, ignoramos el evento
      if (eventRetreatId && eventRetreatId !== retreatId) return;
      fetchRetreat();
    };

    window.addEventListener("retreat:attendance-updated", handleAttendanceUpdated);

    return () => {
      window.removeEventListener(
        "retreat:attendance-updated",
        handleAttendanceUpdated,
      );
    };
  }, [retreatId]);

  const filteredRetreat = retreat.filter((person) =>
    person.names.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleIds = filteredRetreat.map((person) => person.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const handleToggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

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
              <button
                type="button"
                className="hover:underline cursor-pointer"
                onClick={handleToggleAll}
              >
                {allVisibleSelected ? "Desmarcar todos" : "Marcar todos"}
              </button>
              <button
                type="button"
                className="btn btn-primary flex items-center gap-2"
                onClick={() => {
                  if (selectedIds.length === 0) return;
                  (window as any).openModalObservation?.(retreatId, selectedIds);
                }}
              >
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
        <div className="flex flex-col gap-4">
          <FilterInvited value={searchTerm} onChange={setSearchTerm} />
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
                {filteredRetreat.map((bro) => (
                  <tr key={bro.id} className="relative">
                    <td className="min">
                      <div className="content-asist">
                        <input
                          type="checkbox"
                          className="absolute inset-0 m-auto cursor-pointer opacity-0"
                          checked={selectedIds.includes(bro.id)}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(bro.id)
                                ? prev.filter((id) => id !== bro.id)
                                : [...prev, bro.id]
                            )
                          }
                        />
                        <span className="span-icon animate-entry-checks">
                          <CheckIcon className="size-6 block text-sky-500" />
                        </span>
                      </div>
                    </td>
                    <td className="min">{bro.number_community}</td>
                    <td>{bro.names}</td>
                    <td>{bro.civil_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};