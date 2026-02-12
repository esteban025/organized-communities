import { CalendaryIcon, EditIcon } from "@/icons/iconsReact"
import type { RetreatsGet } from "@/types/retreats"
import { transformDate } from "@/utils/transformDate"
import { actions } from "astro:actions"
import { useEffect, useState } from "react"

export const ViewConvivencias = () => {
  const [retreats, setRetreats] = useState<RetreatsGet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleEditRetreat = (e: React.MouseEvent<HTMLButtonElement>, retreat: RetreatsGet) => {
    e.preventDefault()
    const anyWindow = window as any
    if (typeof anyWindow.handleEditRetreat === "function") {
      anyWindow.handleEditRetreat(retreat)
    } else {
      console.warn("handleEditRetreat function is not defined on window")
    }
  }
  return (
    <div>
      {loading && <p>Cargando convivencias...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && retreats.length === 0 && (<p className="message-card">No hay convivencias disponibles.</p>)}
      {!loading && !error && retreats.length > 0 && (
        <ul className="grid grid-cols-2 gap-4">
          {retreats.map((retreat) => (
            <div className="group relative" key={retreat.id}>
              <div className="absolute bottom-3 right-2 transform opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button className="atn-btn" onClick={(e) => handleEditRetreat(e, retreat)}>
                  <EditIcon className="block size-5" />
                </button>
              </div>
              <a
                className="rounded-2xl p-2 px-4 bg-neutral-50/50 hover:bg-neutral-100 transition-colors duration-300 space-y-2 flex justify-between gap-4 border-2 border-neutral-200 hover:border-neutral-300 cursor-pointer"
                href={`/retreat/${retreat.id}`}
              >

                <div className="font-forum">
                  <h3 className="text-lg font-semibold text-start">{retreat.title}</h3>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <CalendaryIcon className="size-5 text-neutral-400" />
                    <p>{transformDate(retreat.start_date)} - {transformDate(retreat.end_date)}</p>
                    {/* <p>{retreat.start_date} - {retreat.end_date}</p> */}
                  </div>
                  <p className="font-medium capitalize mt-5 ">
                    {retreat.status === "planificacion" && (
                      <span className="text-sky-600/80 bg-sky-100/40 border border-sky-600/40 group-hover:border-sky-600/90 px-3 py-1 rounded-full">Planificada</span>
                    )}
                    {retreat.status === "en_curso" && (
                      <span className="text-green-600 border border-green-600 bg-green-100/30 px-3 py-1 rounded-full">Activa</span>
                    )}
                    {retreat.status === "finalizada" && (
                      <span className="text-violet-600 bg-violet-100/30 border border-violet-600/40 px-3 py-1 rounded-full">Finalizada</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-start">
                  {retreat.communities.map(comm => (
                    <p key={comm.id} className="truncate text-neutral-500 text-sm">• {comm.responsable || "--"}</p>
                  ))}
                </div>
              </a>
            </div>
          ))}
        </ul>
      )}
    </div>
  )
}