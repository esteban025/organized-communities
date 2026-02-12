import { useEffect, useState } from "react";
import { actions } from "astro:actions";
import type { BrotherLeader } from "@/types/brothers";
import { RefreshIcon } from "@/icons/iconsReact";
import { getInitialsName } from "@/scripts/getInitialsName";

export const ViewLeadersCommunity = ({ communityId }: { communityId: number }) => {

  const [groupLeaders, setGroupLeaders] = useState<BrotherLeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupLeaders = async () => {
      try {
        const { data, error } = await actions.getGroupLeaders({ communityId });
        if (error || !data?.success) {
          setError(data?.message || "Failed to fetch group leaders.");
          setIsLoading(false);
          return;
        }
        setGroupLeaders(data?.data);
        setIsLoading(false);

      } catch (err) {
        setError("An unexpected error occurred.");
        setIsLoading(false);
      }
    }
    fetchGroupLeaders();
    const handleBrothersUpdated = () => {
      fetchGroupLeaders();
    };

    window.addEventListener("brothers:updated", handleBrothersUpdated);

  }, [communityId]);

  const responsables = groupLeaders.filter(gl => gl.role === 'responsable');
  const corresponsables = groupLeaders.filter(gl => gl.role === 'corresponsable');
  const otros = groupLeaders.filter(gl => gl.role?.includes('ostiario') || gl.role?.includes('didascala'));
  const catequistas = groupLeaders.filter(gl => gl.role?.includes('catequista'));
  console.log(responsables)
  return (
    <div className="ss">
      {isLoading && (
        <div className="message-card loading h-full">
          <span>Cargando hermanos...</span>
          <RefreshIcon className="animate-spin size-4 block" />
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && (
        <div className="grid gap-4 grid-areas-group-leaders">
          <div className="responsables">
            <h3 className="font-semibold mb-2">Responsables</h3>
            {responsables.length > 0 && (
              <ul>
                {responsables.map((leader) => (
                  <li key={leader.group_id} className="">
                    <div className="ss">
                      <span className="initials text-sky-400">{getInitialsName(leader.names)}</span>
                      <span className="truncate max-w-37.5">{leader.names}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="corresponsables">
            <h3 className="font-semibold mb-2">Corresponsables</h3>
            {corresponsables.length > 0 && (
              <ul>
                {corresponsables.map((leader) => (
                  <li key={leader.group_id}>
                    <div className="ss">
                      <span className="initials">{getInitialsName(leader.names)}</span>
                      <span className="truncate max-w-37.5">{leader.names}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="otros">
            <h3 className="font-semibold mb-2">Otros Cargos</h3>
            {otros.length > 0 && (
              <ul>
                {otros.map((leader) => (
                  <li key={leader.group_id} className="flex items-center justify-between gap-2">
                    <div className="ss">
                      <span className="initials">{getInitialsName(leader.names)}</span>
                      <span className="truncate max-w-30">{leader.names}</span>
                    </div>
                    <span className="capitalize text-neutral-600 text-sm">{leader.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="catequistas">
            <h3 className="font-semibold mb-2">Catequistas</h3>
            {catequistas.length > 0 && (
              <ul>
                {catequistas.map((leader) => (
                  <li key={leader.group_id}>
                    <div className="ss">
                      <span className="initials">{getInitialsName(leader.names)}</span>
                      <span className="truncate max-w-37.5">{leader.names}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}