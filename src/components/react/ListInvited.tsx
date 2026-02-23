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
  const [invitados, setInvitados] = useState<BrotherInvited[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [communityNumberFilter, setCommunityNumberFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchInvitados = async () => {
      try {
        const { data, error } = await actions.getBrotherOfRetreatById({ id: retreatId });
        if (error) {
          setError("Error al cargar los invitados.");
        } else {
          setInvitados(data.data);
        }
        setLoading(false);
      } catch (error) {
        setError("Error al cargar los invitados.");
        setLoading(false);
      }
    };

    fetchInvitados();

    const handleAttendanceUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ retreat_id?: number }>;
      const eventRetreatId = customEvent.detail?.retreat_id;
      if (eventRetreatId && eventRetreatId !== retreatId) return;
      fetchInvitados();
      setSelectedIds([]);
    };

    window.addEventListener("retreat:attendance-updated", handleAttendanceUpdated);

    const handleNewInvites = (event: Event) => {
      const customEvent = event as CustomEvent<{
        retreat_id: number;
        invites: any[];
      }>;
      const eventRetreatId = customEvent.detail?.retreat_id;
      if (eventRetreatId && eventRetreatId === retreatId) {
        // Agregar nuevos invitados a la misma lista
        const newInvites = customEvent.detail.invites.map((invite) => ({
          id: invite.person_id,
          names: invite.names,
          civil_status: invite.civil_status,
          community_id: invite.community_id,
          number_community: invite.number_community,
          marriage_id: invite.marriage_id,
          spouse_id: invite.spouse_id,
          spouse_name: invite.spouse_name,
          person_role: invite.person_role,
        }));
        setInvitados((prev) => [
          ...prev,
          ...newInvites.filter((newInv) => !prev.some((existing) => existing.id === newInv.id)),
        ]);
      }
    };

    window.addEventListener("retreat:new-invites", handleNewInvites);

    return () => {
      window.removeEventListener("retreat:attendance-updated", handleAttendanceUpdated);
      window.removeEventListener("retreat:new-invites", handleNewInvites);
    };
  }, [retreatId]);

  const filteredInvitados = invitados.filter(
    (person) =>
      person.names.toLowerCase().includes(searchTerm.toLowerCase()) &&
      person.number_community.toString().includes(communityNumberFilter),
  );

  const visibleIds = filteredInvitados.map((person) => person.id);
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
        {invitados && (
          <>
            <button
              className="btn btn-secondary flex items-center gap-2"
              onClick={() => (window as any).openModalInvited?.(retreatId)}
            >
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

      {!loading && !error && invitados.length === 0 && (
        <p className="message-card">No hay hermanos para esta convivencia.</p>
      )}

      {!loading && !error && invitados.length > 0 && (
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
                {filteredInvitados.map((persona) => (
                  <tr key={persona.id} className="relative">
                    <td className="min">
                      <div className="content-asist">
                        <input
                          type="checkbox"
                          className="absolute inset-0 m-auto cursor-pointer opacity-0"
                          checked={selectedIds.includes(persona.id)}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(persona.id)
                                ? prev.filter((id) => id !== persona.id)
                                : [...prev, persona.id],
                            )
                          }
                        />
                        <span className="span-icon animate-entry-checks pointer-events-none">
                          <CheckIcon className="size-6 block text-sky-500" />
                        </span>
                      </div>
                    </td>
                    <td className="min">{persona.number_community}</td>
                    <td>{persona.names}</td>
                    <td>{persona.civil_status}</td>
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