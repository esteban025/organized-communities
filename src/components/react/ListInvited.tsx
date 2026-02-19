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
  const [newInvites, setNewInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [communityNumberFilter, setCommunityNumberFilter] = useState("");
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

    const handleNewInvites = (event: Event) => {
      const customEvent = event as CustomEvent<{
        retreat_id: number;
        invites: any[];
      }>;
      const eventRetreatId = customEvent.detail?.retreat_id;
      // Solo agregar invitados si es para esta convivencia
      if (eventRetreatId && eventRetreatId === retreatId) {
        setNewInvites((prev) => [...prev, ...customEvent.detail.invites]);
      }
    };

    window.addEventListener("retreat:new-invites", handleNewInvites);

    return () => {
      window.removeEventListener(
        "retreat:attendance-updated",
        handleAttendanceUpdated,
      );
      window.removeEventListener("retreat:new-invites", handleNewInvites);
    };
  }, [retreatId]);

  const filteredRetreat = retreat.filter((person) =>
    person.names.toLowerCase().includes(searchTerm.toLowerCase()) &&
    person.number_community.toString().includes(communityNumberFilter)
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

  const handleOpenModalInvited = () => {
    // abrir la modal
    const anyWindow = window as any;
    if (anyWindow.openModalInvited) {
      anyWindow.openModalInvited(retreatId);
    } else {
      console.warn("La función openModalInvited no está disponible en window.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        {retreat && (
          <>
            <button className="btn btn-secondary flex items-center gap-2" onClick={handleOpenModalInvited}>
              <PlusIcon className="size-4 block" />
              <span>Invitar</span>
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                className="hover:underline cursor-pointer font-forum"
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
          <FilterInvited
            value={searchTerm}
            onChange={setSearchTerm}
            communityNumber={communityNumberFilter}
            onCommunityNumberChange={setCommunityNumberFilter}
          />
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
                        <span className="span-icon animate-entry-checks pointer-events-none">
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

          <div className="ss">
            <header>
              <h2>Mas invitados</h2>
            </header>
            <div className="container-table">
              {newInvites.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      {headTable.map((item) => (
                        <th key={item}>{item}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {newInvites.map((invite, idx) => (
                      <tr key={`${invite.person_id}-${idx}`} className="relative">
                        <td className="min">
                          <div className="content-asist">
                            <input
                              type="checkbox"
                              className="absolute inset-0 m-auto cursor-pointer opacity-0"
                              checked={selectedIds.includes(invite.person_id)}
                              onChange={() =>
                                setSelectedIds((prev) =>
                                  prev.includes(invite.person_id)
                                    ? prev.filter((id) => id !== invite.person_id)
                                    : [...prev, invite.person_id]
                                )
                              }
                            />
                            <span className="span-icon animate-entry-checks pointer-events-none">
                              <CheckIcon className="size-6 block text-sky-500" />
                            </span>
                          </div>
                        </td>
                        <td className="min">{invite.number_community}</td>
                        <td>{invite.names}</td>
                        <td>{invite.civil_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  Sin nuevos invitados aún
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};