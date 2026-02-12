import { actions } from "astro:actions"
import { TableParishes } from "@/components/react/TableParishes"
import { useEffect, useMemo, useState } from "react"
import type { ParishWithCounts } from "@/types/parishes"
import { RefreshIcon } from "@/icons/iconsReact"
import { FilterParish } from "./FilterParish"

interface ParishData {
  parishes: ParishWithCounts[]
  total_parishes: number
  total_communities: number
}

export const ViewParishes = () => {
  const [parishes, setParishes] = useState<ParishData>({ parishes: [], total_parishes: 0, total_communities: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchParishes = async () => {
      setLoading(true)
      try {
        const { data, error } = await actions.getParishes({})
        if (!data?.success || error) {
          setLoading(false)
          setError(error?.message || "Failed to fetch parishes")
        }
        setParishes(data?.data || { parishes: [], total_parishes: 0, total_communities: 0 })
        setLoading(false)
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unexpected error occurred")
        setLoading(false)
      }
    }
    fetchParishes()

    const handleParishUpdated = () => { fetchParishes() }
    window.addEventListener("parish:updated", handleParishUpdated);

    return () => {
      window.removeEventListener("parish:updated", handleParishUpdated);
    };
  }, [])

  const filteredParishes = useMemo<ParishWithCounts[]>(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return parishes.parishes

    return parishes.parishes.filter((parish) =>
      parish.name.toLowerCase().includes(term)
    )
  }, [parishes, searchTerm])

  const description = `Parroquias: ${parishes.total_parishes} •  Comunidades: ${parishes.total_communities}`


  return (
    <div className="flex flex-col gap-4 h-full mt-6">
      {/* <p className="text-neutral-500 pl-10 mb-2 text-sm">{description}</p> */}
      <FilterParish
        value={searchTerm}
        onChange={setSearchTerm}
        onReset={() => setSearchTerm("")}
      />
      {loading && (
        <div className="message-card loading flex-1">
          <span>Cargando parroquias...</span>
          <RefreshIcon className="animate-spin size-4 block" />
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {!loading && !error && filteredParishes.length === 0 && (
        <div className="message-card flex-1">No hay parroquias disponibles.</div>
      )}
      {!loading && !error && filteredParishes.length > 0 && (
        <TableParishes
          parishes={filteredParishes}
          total={{
            total_parishes: parishes.total_parishes,
            total_communities: parishes.total_communities,
          }}
        />
      )}
    </div>
  )
}