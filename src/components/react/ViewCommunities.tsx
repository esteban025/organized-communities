import type { CommunityWithBrotherCount } from "@/types/communities";
import { TableCommunities } from "./TableCommunities";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";

export const ViewCommunities = ({ parishId }: { parishId: number }) => {
  const [communities, setCommunities] = useState<CommunityWithBrotherCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fechCommunities = async () => {
      setLoading(true);
      try {

        const { data, error } = await actions.getCommunities({ parishId });
        if (!data?.success || error) {
          setLoading(false);
          setError(data?.message || error?.message || "Error desconocido");
          return;
        }
        setCommunities(data.data || []);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError("Error desconocido desc");
      }
    }
    fechCommunities();
    const handleCommunitiesUpdate = () => {
      fechCommunities();
    };
    window.addEventListener("communities:updated", handleCommunitiesUpdate);
    return () => {
      window.removeEventListener("communities:updated", handleCommunitiesUpdate);
    };
  }, [parishId]);
  return (
    <div className="ss">
      {loading && <p>Cargando comunidades...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && communities.length === 0 && (<p>No hay comunidades disponibles.</p>)}
      {!loading && !error && communities.length > 0 && (
        <TableCommunities communities={communities} />
      )}
    </div>
  );
}