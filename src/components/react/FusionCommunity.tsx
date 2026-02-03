import type { CommunityWithBrotherCount } from "@/types/communities";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

export const FusionCommunity = ({ parishId }: { parishId: number }) => {
  const [communities, setCommunities] = useState<CommunityWithBrotherCount[]>([]);
  const [showCommunities, setShowCommunities] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await actions.getCommunities({ parishId });
      if (error || !data.success) {
        console.error("Error fetching communities:", error ?? data.message);
        setCommunities([]);
        return;
      }
      setCommunities(data.data);
    }

    fetchCommunities();
  }, [parishId]);

  const handleCheckboxChange = (id: number, event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setSelectedOrder((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((value) => value !== id);
    });
  };

  const firstSelectedId = selectedOrder[0];
  return (
    <>
      {/* Hidden input para enviar el id de la primera comunidad seleccionada en el orden de clic */}
      <input
        type="hidden"
        name="first-community-id"
        value={firstSelectedId ?? ""}
      />
      {showCommunities && (
        <span
          className="text-sm text-neutral-500 leading-4 text-center text-balance w-11/12 mx-auto animate-entry"
        >La primera comunidad seleccionada será la que permanezca"
        </span>
      )}
      <div className={`container-communities ${showCommunities ? "" : "hidden"}`}>
        {communities.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            No hay comunidades para esta parroquia.
          </p>
        )}

        {communities.length > 1 && (
          <div className="space-y-1">
            {
              communities.map((comm) => (
                <div
                  key={comm.id}
                  className={`content-input-check selected-in-fusion ${firstSelectedId === comm.id ? "first-check" : ""}`}
                >
                  <label className="">
                    <input
                      id={`fusion-community-${comm.id}`}
                      name="fusion-communities"
                      type="checkbox"
                      value={comm.id}
                      className="absolute inset-0 opacity-0 cursor-pointer communities-check"
                      onChange={(event) => handleCheckboxChange(comm.id, event)}
                    />
                    <p className="capitalize flex items-center justify-between pl-2">
                      <span className="font-semibold">
                        {comm.responsable ? comm.responsable : "Sin responsable"}
                      </span>
                      <span className="num-comm">{comm.number_community}</span>
                    </p>
                  </label>
                </div>
              ))
            }
          </div>
        )}
      </div>
      {!showCommunities && (
        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowCommunities(true)}
            disabled={communities.length === 0}
          >
            Cargar Comunidades
          </button>
        </div>
      )}
      {showCommunities && (
        <div className="content-actions">
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={() => setShowCommunities(false)}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary w-full">
            Fusionar
          </button>
        </div>
      )}
    </>
  )
}