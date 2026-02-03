import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import type { BrotherwithRolesOutDB } from "@/types/brothers";

const headTable = [
  'Nombres',
  // 'Roles',
  'Estado Civil',
  'Observaciones',
  // 'Acciones',
];
export const ListInvited = () => {

  const [communityIds, setCommunityIds] = useState<number[]>([]);
  const [persons, setPersons] = useState<BrotherwithRolesOutDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        retreatId: number;
        title: string;
        communityIds: number[];
      }>;

      setCommunityIds(customEvent.detail.communityIds || []);
    };

    window.addEventListener("retreat:selected", handler);
    return () => {
      window.removeEventListener("retreat:selected", handler);
    };
  }, []);

  useEffect(() => {
    const fetchingCommunities = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          communityIds.map(async (communityId) => {
            const { data, error } = await actions.getBrothers({
              communityId,
            });
            if (error || !data?.success) {
              throw new Error(error?.message || data?.message || "Error al obtener hermanos");
            }
            return data.data as BrotherwithRolesOutDB[];
          })
        );

        // results es un array de arrays (una por comunidad). Las unimos.
        const merged = results.flat();
        setPersons(merged);
        setLoading(false);
      } catch (error) {
        setError("Error fetching communities");
        setLoading(false);
      }
    }
    if (communityIds.length === 0) {
      setPersons([]);
      return;
    }

    fetchingCommunities();
  }, [communityIds]);


  if (communityIds.length === 0) {
    return (
      <p className="message-card">
        Selecciona una convivencia para ver sus comunidades invitadas.
      </p>
    );
  }

  return (
    <div className="ss">
      {loading && <p>Cargando invitados...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && persons.length === 0 && (<p>No hay invitados disponibles.</p>)}
      {!loading && !error && persons.length > 0 && (
        <div className="flex flex-col">
          <div className="grid grid-cols-3 gap-4 p-2 border-b-2 border-neutral-300">
            {headTable.map((head) => (
              <div key={head} className="font-semibold text-neutral-700 text-center">
                {head}
              </div>
            ))}
          </div>
          {persons.map((brotherList) => (
            <div key={brotherList.group_id} className="grid grid-cols-3 gap-2 p-2 hover:bg-neutral-200 odd:bg-white even:bg-neutral-100">
              <div className="truncate">{brotherList.names}</div>
              <div className="text-center">{brotherList.civil_status}</div>
              <div className="ss">
                <input type="text" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};