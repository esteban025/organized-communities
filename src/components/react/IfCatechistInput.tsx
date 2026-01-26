import { actions } from "astro:actions"
import type { ParishWithCounts } from "@/types/parishes"
import { useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import { ArrowShortIcon } from "@/icons/iconsReact"
import type { CommunityWithBrotherCount } from "@/types/communities"

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
      setParishes(data.data)
    }
    fetchParishes()
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
      if (checked) {
        // agregar si no está ya seleccionada
        if (prev.some((c) => c.id === community.id)) return prev
        return [...prev, community]
      }
      // quitar si se desmarca
      return prev.filter((c) => c.id !== community.id)
    })
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-center text-sm text-neutral-500 leading-4">Selecciona la parroquia de la comunidad que deseas encontrar y posteriormente la comunidad</span>
      <div className="parroquias">
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
          <p className="text-red-400 text-sm text-center">No hay comunidades para esta parroquia</p>
        )}

        {selectedParishId && communities.length > 0 && (
          <div className="mt-2 communities-view">
            {communities.map((community) => (
              <div className="bg-neutral-100 p-2 px-5 rounded-full hover:bg-neutral-200 transition-colors relative comm-selected" key={community.id}>
                <label className="">
                  <input
                    type="checkbox"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={community.id}
                    checked={selectedCommunities.some(
                      (c) => c.id === community.id,
                    )}
                    onChange={(event) =>
                      handleCommunityToggle(event, community)
                    }
                  />
                  <span>
                    {community.number_community} - {community.responsables}
                  </span>
                </label>
              </div>

            ))}
          </div>
        )}

        {selectedCommunities.length > 0 && (
          <fieldset className="mt-2">
            <legend>Comunidades Selecciondas</legend>
            <ul>
              {selectedCommunities.map((community) => {
                const parishName = parishes.find(
                  (p) => p.id === community.parish_id,
                )?.name
                return (
                  <li key={community.id}>
                    Comunidad {community.number_community} - {community.responsables}
                    {parishName ? ` (${parishName})` : ""}
                  </li>
                )
              })}
            </ul>
          </fieldset>
        )}
      </div>
    </div>
  )
}