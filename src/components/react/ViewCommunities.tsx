import type { CommunityWithBrotherCount } from "@/types/communities";
import { TableCommunities } from "./TableCommunities";
import { FilterCommunity, type CommunityFilters } from "./FilterCommunity";
import { RefreshIcon } from "@/icons/iconsReact";
import { actions } from "astro:actions";
import { useEffect, useMemo, useState } from "react";

export const ViewCommunities = ({ parishId }: { parishId: number }) => {
  const [communities, setCommunities] = useState<CommunityWithBrotherCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<CommunityFilters>({
    responsable: "",
    parity: "all",
    number: "",
    paso: "",
  });

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

  const filteredCommunities = useMemo(() => {
    return communities.filter((community) => {
      // filtro por responsable (contiene, case-insensitive)
      if (filters.responsable.trim()) {
        const resp = community.responsable || "";
        if (!resp.toLowerCase().includes(filters.responsable.toLowerCase())) {
          return false;
        }
      }

      // filtro por número exacto de comunidad
      if (filters.number.trim()) {
        const numberFilter = Number(filters.number.trim());
        if (!Number.isNaN(numberFilter) && community.number_community !== numberFilter) {
          return false;
        }
      }

      // filtro por par/impar (si no hay número exacto, aplicamos sobre number_community)
      if (filters.parity !== "all") {
        const isEven = community.number_community % 2 === 0;
        if (filters.parity === "even" && !isEven) return false;
        if (filters.parity === "odd" && isEven) return false;
      }

      // filtro por paso (contiene, case-insensitive)
      if (filters.paso.trim()) {
        const paso = community.level_paso || "";
        if (!paso.toLowerCase().includes(filters.paso.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [communities, filters]);
  return (
    <div className="flex flex-col gap-4 h-full">
      <FilterCommunity
        filters={filters}
        onChange={setFilters}
        onReset={() =>
          setFilters({ responsable: "", parity: "all", number: "", paso: "" })
        }
      />
      {loading && (
        <div className="message-card loading flex-1">
          <span>Cargando comunidades...</span>
          <RefreshIcon className="animate-spin size-4 block" />
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}

      {filteredCommunities.length === 0 && !loading && !error && (
        <div className="message-card h-full">No hay comunidades disponibles.</div>
      )}

      {!loading && !error && filteredCommunities.length > 0 && (
        <TableCommunities communities={filteredCommunities} />
      )}
    </div>
  );
}