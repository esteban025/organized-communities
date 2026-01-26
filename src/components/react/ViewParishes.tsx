import { actions } from "astro:actions"
import { TableParishes } from "@/components/react/TableParishes"
import { useEffect, useMemo, useState } from "react"
import type { ParishWithCounts } from "@/types/parishes"
import { RefreshIcon } from "@/icons/iconsReact"
import { FilterParish } from "./FilterParish"

export const ViewParishes = () => {
  const [parishes, setParishes] = useState<ParishWithCounts[]>([])
  const [loading, setLoading] = useState(false)
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
        setParishes(data?.data || [])
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

  const filteredParishes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return parishes

    return parishes.filter((parish) =>
      parish.name.toLowerCase().includes(term)
    )
  }, [parishes, searchTerm])


  return (
    <div className="flex flex-col gap-4">
      <FilterParish
        value={searchTerm}
        onChange={setSearchTerm}
        onReset={() => setSearchTerm("")}
      />
      {loading && (
        <p className="text-neutral-600 flex items-center gap-2">
          <span>Cargando parroquias...</span>
          <RefreshIcon className="animate-spin size-4 block" />
        </p>
      )}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <TableParishes parishes={filteredParishes} />
      )}
    </div>
  )
}