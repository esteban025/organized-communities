import type { RetreatHouse } from "@/types/retreatHouses"
import { actions } from "astro:actions"
import { useEffect, useState } from "react"

export const SelectRetreatHouse = () => {
  const [retreatHouses, setRetreatHouses] = useState<RetreatHouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRetreatHouses = async () => {
      setLoading(true)
      try {
        const { data, error } = await actions.getRetreatHouses()
        if (!data?.success || error) {
          setError("Error fetching retreat houses")
          setRetreatHouses([])
          setLoading(false)
          return
        }
        setRetreatHouses(data.data || [])
        setLoading(false)
      } catch (error) {
        setError("Error fetching retreat houses")
        setRetreatHouses([])
        setLoading(false)
      }
    }
    fetchRetreatHouses()
  }, [])
  return (
    <select name="select-house" id="select-house" className="select-input">
      <option className="options-select" disabled>-- Selecciona un hospedaje</option>
      {retreatHouses.map((home) => (
        <option key={home.id} value={home.id} className="options-select">{home.name}</option>
      ))}
    </select>
  )
}