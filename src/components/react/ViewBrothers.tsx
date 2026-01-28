import type { BrotherwithRoles, BrotherwithRolesOutDB } from "@/types/brothers";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import { TableBrothers } from "./TableBrothers";
import { FilterBrother } from "./FilterBrother";
import { RefreshIcon } from "@/icons/iconsReact";

export const ViewBrothers = ({ communityId }: { communityId: number }) => {
  const [brothers, setBrothers] = useState<BrotherwithRolesOutDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setBrothers(data.data);
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
  return (
    <div className="h-full flex flex-col gap-4">
      <FilterBrother
        value={""}
        onChange={() => { }}
        onReset={() => { }}
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
      {!loading && !error && brothers.length > 0 && (
        <TableBrothers brothers={brothers} />
      )}
    </div>
  );
}