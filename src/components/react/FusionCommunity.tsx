import type { CommunityWithBrotherCount } from "@/types/communities";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";

export const FusionCommunity = ({ parishId }: { parishId: number }) => {
  const [communities, setCommunities] = useState<CommunityWithBrotherCount[]>([]);
  const [showCommunities, setShowCommunities] = useState(false);

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
  return (
    <>
      <div className={`container-communities ${showCommunities ? "" : "hidden"}`}>
        {communities.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            No hay comunidades para esta parroquia.
          </p>
        ) : (
          <div className="space-y-2">
            {
              communities.map((comm) => (
                <div key={comm.id} className="content-input-check role-selected">
                  <label className="">
                    <input
                      id={`fusion-community-${comm.id}`}
                      name="fusion-communities"
                      type="checkbox"
                      value={comm.id}
                      className="absolute inset-0 opacity-0 cursor-pointer communities-check"
                    />
                    <p className="capitalize flex items-center justify-between">
                      <span className="font-semibold">
                        {comm.responsable ? comm.responsable : "Sin responsable"}
                      </span>
                      <span className="bg-neutral-800 text-white flex justify-center items-center w-10 aspect-square rounded-full">{comm.number_community}</span>
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