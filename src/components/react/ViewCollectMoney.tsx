import { useCallback, useMemo, useState } from "react"
import { actions } from "astro:actions"
import { CheckSquareIcon } from "@/icons/iconsReact";
import type { CommunityCharge } from "@/types/retreats";

interface ViewCollectMoneyProps {
  retreatId: number
  title: string
  costPerPerson: number
  initialCommunities: CommunityCharge[]
}

interface PaymentState {
  [communityId: number]: number
}

export const ViewCollectMoney = ({
  retreatId,
  title,
  costPerPerson,
  initialCommunities,
}: ViewCollectMoneyProps) => {
  const [communities, setCommunities] = useState<CommunityCharge[]>(initialCommunities)
  const [payments, setPayments] = useState<PaymentState>({})
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  const fetchCharges = useCallback(async () => {
    try {
      const { data, error } = await actions.getRetreatCommunityCharges({ retreat_id: retreatId })
      if (data?.success && data.data) {
        setCommunities(data.data.communities)
        setPayments({}) // limpiar pagos locales para usar los valores frescos
      }
    } catch (err) {
      console.error("Error recargando cargos:", err)
    }
  }, [retreatId])

  const rows = useMemo(() => {
    return communities.map((comm) => {
      const initialPaid = Math.max(
        comm.total_cost - (comm.total_debt ?? comm.total_cost),
        0,
      )
      const paid = payments[comm.community_id] ?? initialPaid
      const debt = Math.max(comm.total_cost - paid, 0)
      return { ...comm, paid, debt, initialPaid }
    })
  }, [communities, payments])

  const savePayment = async (communityId: number, amountPaid: number) => {
    const comm = communities.find((c) => c.community_id === communityId)
    if (!comm || saving) return
    try {
      setSaving(true)
      await actions.saveRetreatCommunityPayments({
        retreat_id: retreatId,
        payments: [
          {
            community_id: communityId,
            total_attendees: comm.total_attendees,
            total_cost: comm.total_cost,
            amount_paid: amountPaid,
          },
        ],
      })
      await fetchCharges()
    } catch (error) {
      console.error("Error guardando pago de comunidad:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePayment = (communityId: number, value: string) => {
    const num = Number(value.replace(/[^0-9.]/g, ""))
    if (Number.isNaN(num)) return
    setPayments((prev) => ({ ...prev, [communityId]: num }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, communityId: number, fallbackInitialPaid: number) => {
    if (e.key === "Enter") {
      e.currentTarget.blur()
      const paid = payments[communityId] ?? fallbackInitialPaid ?? 0
      savePayment(communityId, paid)
    }
  }

  const totalSummary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalAttendees += row.total_attendees
        acc.totalCost += row.total_cost
        acc.totalPaid += row.paid
        acc.totalDebt += row.debt
        return acc
      },
      { totalAttendees: 0, totalCost: 0, totalPaid: 0, totalDebt: 0 },
    )
  }, [rows])

  const handleFinalize = async () => {
    if (finalizing) return

    try {
      setFinalizing(true)
      await actions.updateRetreatStatus({
        retreat_id: retreatId,
        status: "finalizada",
      })
    } catch (error) {
      console.error("Error al finalizar convivencia:", error)
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Cobros por comunidad</h1>
        <p className="text-sm text-neutral-600">
          Convivencia: <span className="font-medium">{title}</span> (ID: {retreatId})
        </p>
        <p className="text-sm text-neutral-600">
          Costo por persona: <span className="font-medium">${Number(costPerPerson).toFixed(2)}</span>
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="message-card">
          No hay comunidades con asistentes marcados como que asistieron para esta convivencia.
        </p>
      ) : (
        <>
          <div className="container-table">
            <table>
              <thead>
                <tr>
                  <th>Parroquia</th>
                  <th>Comunidad</th>
                  <th>Total asistentes</th>
                  <th>Total a pagar</th>
                  <th>Monto pagado</th>
                  <th>Deuda restante</th>
                  <th>Carta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.community_id}>
                    <td>{row.parish_name}</td>
                    <td className="min">N° {row.number_community}</td>
                    <td className="min text-center">{row.total_attendees}</td>
                    <td className="min text-right">${row.total_cost.toFixed(2)}</td>
                    <td className="min">
                      <input
                        type="number"
                        min={0}
                        className="input w-full text-right"
                        value={row.paid || ""}
                        onChange={(e) => handleChangePayment(row.community_id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row.community_id, row.initialPaid)}
                        disabled={saving}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="min text-right font-medium">
                      ${row.debt.toFixed(2)}
                    </td>
                    <td>
                      <div className="flex items-center justify-center">
                        {/* enviar el retreatId y la id de la comunidad */}
                        <a href={`/carta/${retreatId}-${row.community_id}`} className="atn-btn">
                          <span className="size-5 block">📄</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="tr-foot">
                  <th colSpan={2} className="text-right">
                    Totales
                  </th>
                  <th className="min text-center">{totalSummary.totalAttendees}</th>
                  <th className="min text-right">${totalSummary.totalCost.toFixed(2)}</th>
                  <th className="min text-right">${totalSummary.totalPaid.toFixed(2)}</th>
                  <th className="min text-right">${totalSummary.totalDebt.toFixed(2)}</th>
                  <th></th>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="btn btn-primary flex items-center justify-center gap-2"
              onClick={handleFinalize}
              disabled={finalizing}
            >
              <CheckSquareIcon className="size-5 block text-white" />
              <span>
                {finalizing ? "Finalizando..." : "Finalizar"}
              </span>
            </button>
          </div>
        </>

      )}
    </div>
  )
}
