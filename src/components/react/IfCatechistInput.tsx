import { actions } from "astro:actions";
import type { ParishWithCounts } from "@/types/parishes";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { ArrowShortIcon } from "@/icons/iconsReact";
import type { CommunityWithBrotherCount } from "@/types/communities";

type CatechistCommunitiesEventDetail = {
  communities: CommunityWithBrotherCount[];
};

export const IfCatechistInput = () => {
  const [parishes, setParishes] = useState<ParishWithCounts[]>([])
  const [communities, setCommunities] = useState<CommunityWithBrotherCount[]>([])
  const [selectedParishId, setSelectedParishId] = useState<number | "">("")
  const [selectedCommunities, setSelectedCommunities] = useState<CommunityWithBrotherCount[]>([])

  useEffect(() => {
    const fetchParishes = async () => {
      const { data, error } = await actions.getParishes()
      if (error || !data.success) {
        console.error("Error fetching parishes:", error)
        return
      }
      setParishes(data.data.parishes)
    }
    fetchParishes()
  }, [])

  // Escuchar cuando se edita un hermano para precargar comunidades catequistas
  useEffect(() => {
    const handleBrotherEdit = async (event: Event) => {
      const custom = event as CustomEvent<{ catechistCommunityIds?: number[] }>
      const ids = custom.detail?.catechistCommunityIds ?? []
      if (!ids.length) return

      try {
        const loaded: CommunityWithBrotherCount[] = []

        for (const id of ids) {
          const { data, error } = await actions.getCommunityById({ id })
          if (error || !data.success || !data.data) continue

          const c = data.data as any
          loaded.push({
            id: c.id,
            number_community: c.number_community,
            parish_id: c.parish_id,
            level_paso: c.level_paso,
            count_persons: 0,
            count_marriages: 0,
            count_singles: 0,
            responsable: null,
          })
        }

        if (!loaded.length) return

        setSelectedCommunities((prev) => {
          const seen = new Set(prev.map((c) => c.id))
          const merged = [...prev]
          loaded.forEach((c) => {
            if (!seen.has(c.id)) merged.push(c)
          })

          window.dispatchEvent(
            new CustomEvent<CatechistCommunitiesEventDetail>(
              "catechist:communities-changed",
              { detail: { communities: merged } },
            ),
          )

          return merged
        })

        // Opcional: seleccionar la parroquia de la primera comunidad para facilitar la vista
        setSelectedParishId((current) => {
          if (current) return current
          return loaded[0].parish_id
        })
      } catch (err) {
        console.error("Error precargando comunidades de catequista:", err)
      }
    }

    window.addEventListener("brother:edit", handleBrotherEdit)
    return () => window.removeEventListener("brother:edit", handleBrotherEdit)
  }, [])

  // recuperamos comunidades de la parroquia seleccionada
  useEffect(() => {
    if (!selectedParishId) return

    const fetchCommunities = async () => {
      const { data, error } = await actions.getCommunities({ parishId: selectedParishId })
      if (error || !data.success) {
        console.error("Error fetching communities:", error ?? data.message)
        setCommunities([])
        return
      }
      setCommunities(data.data)
    }
    fetchCommunities()
  }, [selectedParishId])

  const handleParishChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    if (!value) {
      setSelectedParishId("")
      setCommunities([])
      return
    }
    setSelectedParishId(Number(value))
  }

  const handleCommunityToggle = (
    event: ChangeEvent<HTMLInputElement>,
    community: CommunityWithBrotherCount,
  ) => {
    const { checked } = event.target
    setSelectedCommunities((prev) => {
      let next: CommunityWithBrotherCount[]
      if (checked) {
        if (prev.some((c) => c.id === community.id)) {
          next = prev
        } else {
          next = [...prev, community]
        }
      } else {
        next = prev.filter((c) => c.id !== community.id)
      }

      window.dispatchEvent(
        new CustomEvent<CatechistCommunitiesEventDetail>(
          "catechist:communities-changed",
          { detail: { communities: next } },
        ),
      )

      return next
    })
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="parroquias font-forum">
        <div className="content-input relative">
          <select
            name="parish-selected"
            id="parish-selected"
            className="select-input space-y-1"
            value={selectedParishId}
            onChange={handleParishChange}
          >
            <option className="options-select" value="" disabled>
              Selecciona una parroquia
            </option>
            {parishes.map((parish) => (
              <option key={parish.id} value={parish.id} className="options-select">{parish.name}</option>
            ))}
          </select>
          <ArrowShortIcon className="size-4 block icon-select" />
        </div>
      </div>
      <div className="communities">
        {!selectedParishId && (
          <p className="text-center text-neutral-500 text-sm">Selecciona una parroquia para ver sus comunidades</p>
        )}

        {selectedParishId && communities.length === 0 && (
          <p className="message-card">No hay comunidades para esta parroquia</p>
        )}

        {selectedParishId && communities.length > 0 && (
          <div className="mt-4 communities-view space-y-1">
            {communities.map((community) => {
              const isSelected = selectedCommunities.some(
                (c) => c.id === community.id,
              )
              return (
                <div
                  key={community.id}
                  className="bg-neutral-100 p-2 px-5 rounded-full hover:bg-neutral-200 transition-colors relative comm-selected"
                >
                  <label
                    className=""
                    htmlFor={`community-${community.id}-ipt`}
                  >
                    <input
                      id={`community-${community.id}-ipt`}
                      name={`community-${community.id}-ipt`}
                      type="checkbox"
                      className="absolute inset-0 opacity-0 cursor-pointer comm-input-select"
                      value={community.id}
                      checked={isSelected}
                      onChange={(event) =>
                        handleCommunityToggle(event, community)
                      }
                    />
                    <span className="text-sm">
                      {community.number_community} - {community.responsable}
                    </span>
                  </label>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Inputs ocultos para enviar los IDs de comunidades catequistas */}
      {selectedCommunities.map((community) => (
        <input
          key={community.id}
          type="hidden"
          name="catechist-community-ids"
          value={community.id}
        />
      ))}
    </div>
  )
}