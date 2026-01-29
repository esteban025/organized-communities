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
              <div key={community.id} className="bg-neutral-100 p-2 px-5 rounded-full hover:bg-neutral-200 transition-colors relative comm-selected">
                <label className="" htmlFor={`community-${community.id}-ipt`}>
                  <input
                    id={`community-${community.id}-ipt`}
                    name={`community-${community.id}-ipt`}
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
                    {community.number_community} - {community.responsable}
                  </span>
                </label>
              </div>

            ))}
          </div>
        )}

        {selectedCommunities.length > 0 && (
          <fieldset className="mt-2">
            <legend>Comunidades Selecciondas</legend>
            <ul className="space-y-1">
              {selectedCommunities.map((community) => {
                const parishName = parishes.find(
                  (p) => p.id === community.parish_id,
                )?.name
                return (
                  <li key={community.id}>
                    {/* input oculto para que el formulario principal reciba las IDs */}
                    <input
                      type="hidden"
                      name="catechist-community-ids"
                      value={community.id}
                    />
                    Comunidad {community.number_community} - {community.responsable}
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