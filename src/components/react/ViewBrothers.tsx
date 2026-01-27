import type { BrotherwithRoles } from "@/types/brothers";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import { TableBrothers } from "./TableBrothers";
import { FilterBrother } from "./FilterBrother";

export const ViewBrothers = ({ communityId }: { communityId: number }) => {
  const [brothers, setBrothers] = useState<BrotherwithRoles[]>([]);
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
  console.log("Fetched brothers:", brothers);
  return (
    <div>
      <FilterBrother
        value={""}
        onChange={() => { }}
        onReset={() => { }}
      />
      {loading && <p>Cargando hermanos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && brothers.length === 0 && <p>No hay hermanos en esta comunidad.</p>}
      {!loading && !error && brothers.length > 0 && (
        <TableBrothers brothers={brothers} />
      )}
    </div>
  );
}