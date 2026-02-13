import type { BrotherwithRolesOutDB, TotalsBrothers } from "@/types/brothers";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import { TableBrothers } from "./TableBrothers";
import { FilterBrother } from "./FilterBrother";
import { RefreshIcon } from "@/icons/iconsReact";

export const ViewBrothers = ({ communityId }: { communityId: number }) => {
  const [brothers, setBrothers] = useState<BrotherwithRolesOutDB[]>([]);
  const [totals, setTotals] = useState<TotalsBrothers>({
    total_personas: 0,
    total_matrimonios: 0,
    total_solteros: 0,
    total_solteras: 0,
  })
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterName, setFilterName] = useState("");

  useEffect(() => {
    const fetchBrothers = async () => {
      const { data, error } = await actions.getBrothers({ communityId });
      if (error || !data.success) {
        console.error("Error fetching brothers:", error ?? data.message);
        setBrothers([]);
        setLoading(false);
        setError(data?.message || error?.message || "Unknown error");
        return;
      }
      setBrothers(data.data.brothers);
      setTotals(data.data.totals);
      setLoading(false);
    };

    fetchBrothers();

    const handleBrothersUpdated = () => {
      fetchBrothers();
    };

    window.addEventListener("brothers:updated", handleBrothersUpdated);

    return () => {
      window.removeEventListener("brothers:updated", handleBrothersUpdated);
    };
  }, [communityId]);
  const handleResetFilters = () => {
    setFilterName("");
  };

  const filteredBrothers = brothers.filter((brother) => {
    const matchName =
      filterName.trim() === "" ||
      brother.names.toLowerCase().includes(filterName.toLowerCase())
    return matchName;
  });

  return (
    <div className="h-full flex flex-col gap-4">
      <FilterBrother
        name={filterName}
        onNameChange={setFilterName}
        onReset={handleResetFilters}
      />
      {loading && (
        <div className="message-card loading h-full">
          <span>Cargando hermanos...</span>
          <RefreshIcon className="animate-spin size-4 block" />
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && brothers.length === 0 && (
        <div className="message-card h-full">
          <span>No hay hermanos registrados en esta comunidad.</span>
        </div>
      )}
      {!loading && !error && brothers.length > 0 && filteredBrothers.length === 0 && (
        <div className="message-card h-full">
          <span>No hay hermanos que coincidan con los filtros.</span>
        </div>
      )}
      {!loading && !error && filteredBrothers.length > 0 && (
        <TableBrothers brothers={filteredBrothers} totals={totals} />
      )}
    </div>
  );
}