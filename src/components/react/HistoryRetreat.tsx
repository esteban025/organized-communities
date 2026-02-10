import type { RetreatHistory } from "@/types/retreats"
import { transformDate } from "@/utils/transformDate"
import { actions } from "astro:actions"
import { useEffect, useState } from "react"

const headTable = [
  "Título",
  "Fecha Inicio",
  "Fecha Fin",
  "N° Comunidades",
  "N° Personas",
  "Deuda actual",
  "Actions",
]

export const HistoryRetreats = () => {
  const [rows, setRows] = useState<RetreatHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await actions.getRetreatsHistory()
        if (error || !data?.success) {
          setError(data?.message || error?.message || "Error al obtener historial")
          return
        }
        setRows(data.data || [])
      } catch (err) {
        setError("Error al obtener historial")
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  return (
    <div className="container-table">
      {loading && <p className="message-card loading">Cargando historial...</p>}
      {error && !loading && <p className="message-card error">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="message-card">No hay convivencias finalizadas.</p>
      )}
      {!loading && !error && rows.length > 0 && (
        <table>
          <thead>
            <tr>
              {headTable.map((item) => (
                <th key={item}>{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((retreat) => (
              <tr key={retreat.id}>
                <td>{retreat.title}</td>
                <td className="min">{transformDate(retreat.start_date)}</td>
                <td className="min">{transformDate(retreat.end_date)}</td>
                <td className="min text-center">{retreat.total_communities}</td>
                <td className="min text-center">{retreat.total_personas}</td>
                <td className="min text-right">
                  ${Number(retreat.total_debt ?? 0).toFixed(2)}
                </td>
                <td className="min">
                  <a
                    href={`/collect-money/${retreat.id}`}
                    className="atn-btn"
                    title="Ver detalles de cobros de la convivencia"
                  >
                    Ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}