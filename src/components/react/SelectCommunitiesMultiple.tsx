import type { CommunityWithBrotherCount } from "@/types/communities";
import type { ParishWithCounts } from "@/types/parishes";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";

type SelectedCommunity = Pick<
  CommunityWithBrotherCount,
  "id" | "number_community" | "count_persons" | "responsable"
>;

export const SelectCommunitiesMultiple = () => {
  const [parishes, setParishes] = useState<ParishWithCounts[]>([]);
  const [communities, setCommunities] = useState<CommunityWithBrotherCount[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<number | "">("");
  const [selectedCommunityIds, setSelectedCommunityIds] = useState<number[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<SelectedCommunity[]>([]);

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const { data, error } = await actions.getParishes()
        if (error) {
          console.error("Error fetching parishes:", error);
          return;
        }
        setParishes(data.data);

      } catch (error) {
        console.error("Error fetching parishes:", error);
      }
    }
    fetchParishes();
  }, [])

  // limpiar selección desde el formulario (evento custom)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClear = () => {
      setSelectedParishId("");
      setCommunities([]);
      setSelectedCommunityIds([]);
      setSelectedCommunities([]);
    };

    window.addEventListener("communities:clear-selection", handleClear);
    return () => {
      window.removeEventListener("communities:clear-selection", handleClear);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("retreat:communities-selected", {
        detail: { communities: selectedCommunities },
      })
    );
  }, [selectedCommunities]);

  const handleChangeParish = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (!value) {
      setSelectedParishId("");
      setCommunities([]);
      return;
    }

    const parishId = Number(value);
    setSelectedParishId(parishId);

    try {
      const { data, error } = await actions.getCommunities({ parishId });
      if (error) {
        console.error("Error fetching communities:", error);
        return;
      }
      setCommunities(data.data);
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const handleToggleCommunity = (communityId: number) => {
    setSelectedCommunityIds((prev) => {
      const isSelected = prev.includes(communityId);

      if (isSelected) {
        // quitar de seleccionados
        setSelectedCommunities((prevCommunities) =>
          prevCommunities.filter((c) => c.id !== communityId)
        );
        return prev.filter((id) => id !== communityId);
      }

      // agregar a seleccionados
      const community = communities.find((c) => c.id === communityId);
      if (community) {
        setSelectedCommunities((prevCommunities) => {
          if (prevCommunities.some((c) => c.id === communityId)) return prevCommunities;
          return [
            ...prevCommunities,
            {
              id: community.id,
              number_community: community.number_community,
              count_persons: community.count_persons,
              responsable: community.responsable,
            },
          ];
        });
      }

      return [...prev, communityId];
    });
  };

  return (
    <>
      <div className="content-input">
        <select
          name="parish_id"
          id="parish_id"
          className="select-input"
          value={selectedParishId}
          onChange={handleChangeParish}
        >
          <option value="" disabled className="options-select">
            Selecciona una parroquia
          </option>
          {parishes.map((parish) => (
            <option key={parish.id} value={parish.id} className="options-select">
              {parish.name} ({parish.count_communities} comunidades)
            </option>
          ))}
        </select>
      </div>

      {/* Mostramos comunidades que existen en esa parroquia  */}
      <div className="view-communities mt-4 space-y-1">
        {communities.length === 0 && selectedParishId && (
          <p className="message-card text-balance">
            No hay comunidades disponibles en esta parroquia.
          </p>
        )}
        {communities.map((community) => {
          const id = community.id;
          const checked = selectedCommunityIds.includes(id);
          return (
            <div key={id} className="content-input-check role-selected">
              <label className="">
                <input
                  type="checkbox"
                  value={id}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  checked={checked}
                  onChange={() => handleToggleCommunity(id)}
                />
                <div className="capitalize flex justify-between items-center">
                  <p className="flex items-center gap-2">
                    <span className="num-comm">{community.number_community}</span>
                    <span>{community.responsable ? community.responsable : "--"}</span>
                  </p>
                  <span className="text-neutral-500">({community.count_persons})</span>
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Inputs ocultos para enviar siempre el array actualizado en el form */}
      {selectedCommunityIds.map((id) => (
        <input key={id} type="hidden" name="communities_ids" value={id} />
      ))}
    </>
  );
}