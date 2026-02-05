import { CalendaryIcon } from "@/icons/iconsReact"
import type { RetreatsGet } from "@/types/retreats"
import { transformDate } from "@/utils/transformDate"
import { actions } from "astro:actions"
import { useEffect, useState } from "react"

export const ViewConvivencias = () => {
  const [retreats, setRetreats] = useState<RetreatsGet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState<number | null>(null)

  useEffect(() => {
    const fetchRetreats = async () => {
      try {
        const { data, error } = await actions.getRetreats()
        if (error) {
          setError("Error fetching retreats")
          return
        }
        setRetreats(data?.data)
        setLoading(false)
      } catch (err) {
        setError("Error fetching retreats")
      }
    }
    fetchRetreats()

    const handleRetreatsUpdated = () => {
      fetchRetreats()
    }
    window.addEventListener("retreats:updated", handleRetreatsUpdated)
    return () => {
      window.removeEventListener("retreats:updated", handleRetreatsUpdated)
    }
  }, [])
  return (
    <div className="ss">
      {loading && <p>Cargando convivencias...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && retreats.length === 0 && (<p className="message-card">No hay convivencias disponibles.</p>)}
      {!loading && !error && retreats.length > 0 && (
        <ul className="grid grid-cols-2 gap-4">
          {retreats.map((retreat) => (
            <a
              key={retreat.id}
              className={`rounded-2xl relative p-2 px-4 bg-neutral-50/50 hover:bg-neutral-100 transition-colors duration-300 space-y-2 flex justify-between border-2 border-neutral-200 hover:border-neutral-300 group cursor-pointer ${isActive === retreat.id ? "card-selected" : ""}`}
              href={`/retreat/${retreat.id}`}
            >

              <div className="">

                <h3 className="text-lg font-semibold text-start">{retreat.title}</h3>
                <div className="flex items-center gap-2 text-neutral-700">
                  <CalendaryIcon className="size-5 text-neutral-400" />
                  <p>{transformDate(retreat.start_date)} - {transformDate(retreat.end_date)}</p>
                </div>
                <p className="font-medium capitalize mt-5 ">
                  {retreat.status === "planificacion" && (
                    <span className="text-sky-600/80 border border-sky-600/40 group-hover:border-sky-600/90 px-3 py-1 rounded-full">Planificada</span>
                  )}
                  {retreat.status === "en_curso" && (
                    <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full">Activa</span>
                  )}
                  {retreat.status === "finalizada" && (
                    <span className="text-neutral-600 bg-neutral-300 px-3 py-1 rounded-full">Completada</span>
                  )}
                </p>
              </div>

              <div className="comunidades self-start">
                {retreat.communities.map(comm => (
                  <p key={comm.id} className="text-start">- {comm.responsable || "--"}</p>
                ))}
              </div>
            </a>
          ))}
        </ul>
      )}
    </div>
  )
}