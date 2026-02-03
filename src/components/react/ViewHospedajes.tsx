import type { RetreatHouse } from "@/types/retreatHouses";
import { TableHospedajes } from "./TableHospedajes";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";

export const ViewHospedajes = () => {
  const [hospedajes, setHospedajes] = useState<RetreatHouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchHospedajes = async () => {
      const { data, error } = await actions.getRetreatHouses({});
      if (error || !data.success) {
        console.error("Error fetching hospedajes:", error ?? data.message);
        setError(error?.message ?? data?.message);
        setHospedajes([]);
        setLoading(false);
        return;
      }
      setHospedajes(data.data);
      setLoading(false);
    }
    fetchHospedajes();

    const handleHospedajeUpdate = () => { fetchHospedajes() }
    window.addEventListener("hospedaje:updated", handleHospedajeUpdate)

    return () => {
      window.removeEventListener("hospedaje:updated", handleHospedajeUpdate)
    }
  }, [])
  return (
    <div className="dl">
      {/* <FilterHospedajes /> */}
      {loading && (
        <div className="message-card loading">
          <span>Cargando hospedajes...</span>
        </div>
      )}
      {error && (
        <div className="message-card error">
          <span>Error: {error}</span>
        </div>
      )}
      {!loading && !error && hospedajes.length === 0 && (
        <div className="message-card info">
          <span>No hay hospedajes disponibles.</span>
        </div>
      )}
      {!loading && !error && hospedajes.length > 0 && (
        <TableHospedajes hospedajes={hospedajes} />
      )}
    </div>
  );
};
