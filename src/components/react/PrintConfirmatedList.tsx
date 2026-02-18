import { actions } from "astro:actions"
import { CheckIcon, ReportMoneyIcon, SaveIcon, UserIcon } from "@/icons/iconsReact"
import { transformDate } from "@/utils/transformDate"
import { useEffect, useMemo, useState } from "react"
import type { StatsConf } from "@/types/retreats"

interface ConfirmedGroup {
  group_key: string
  nombres_confirmados: string
  observaciones_combinadas: string | null
  retreat_house_id: number | null
  retreat_house_name: string | null
  person_ids: number[]
  marriage_id: number | null
  civil_status: string
}

interface CommunityData {
  numero: string
  estadisticas: {
    total_personas: number
    total_matrimonios: number
    total_solteros: number
    total_solteras: number
  }
  confirmados: ConfirmedGroup[]
}

interface ParishData {
  parroquia: string
  comunidades: CommunityData[]
}

interface ConvData {
  titulo: string
  fecha_inicio: string
  fecha_fin: string
  costo_por_persona: number
  status: string
}

interface ListProps {
  retreatId: number
  grouped: ParishData[]
  headTable: string[]
  convivencia: ConvData
  estadisticas: StatsConf
  attendedPersonIds: number[]
  viewTotals?: boolean
}

export const PrintConfirmatedList = ({
  retreatId,
  grouped,
  headTable,
  convivencia,
  estadisticas,
  attendedPersonIds,
  viewTotals = true,
}: ListProps) => {
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  // Inicializar selección con los que ya tienen attended = TRUE en BD
  useEffect(() => {
    if (attendedPersonIds && attendedPersonIds.length > 0) {
      setSelectedPersonIds(new Set(attendedPersonIds))
    }
  }, [attendedPersonIds])

  const allPersonIds = useMemo(() => {
    const ids: number[] = []
    grouped.forEach((parish) => {
      parish.comunidades.forEach((comm) => {
        comm.confirmados.forEach((bro) => {
          bro.person_ids.forEach((id) => ids.push(id))
        })
      })
    })
    return ids
  }, [grouped])

  const allSelected = useMemo(() => {
    if (allPersonIds.length === 0) return false
    return allPersonIds.every((id) => selectedPersonIds.has(id))
  }, [allPersonIds, selectedPersonIds])

  const togglePersonSelection = (personId: number) => {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev)
      if (next.has(personId)) {
        next.delete(personId)
      } else {
        next.add(personId)
      }
      return next
    })
  }

  const handleToggleAll = () => {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev)
      const currentlyAllSelected = allPersonIds.length > 0 && allPersonIds.every((id) => next.has(id))

      if (currentlyAllSelected) {
        allPersonIds.forEach((id) => next.delete(id))
      } else {
        allPersonIds.forEach((id) => next.add(id))
      }

      return next
    })
  }

  const handleSaveAttendees = async () => {
    if (saving) return

    const attended_person_ids = Array.from(selectedPersonIds)
    const not_attended_person_ids = allPersonIds.filter((id) => !selectedPersonIds.has(id))

    try {
      setSaving(true)
      const { data, error } = await actions.updateRetreatAttendeesStatus({
        retreat_id: retreatId,
        attended_person_ids,
        not_attended_person_ids,
      })

      if (!data?.success || error) {
        console.error(data?.message || error?.message || "Error al guardar asistentes")
        return
      }

      // Opcional: disparar evento global para que otras vistas refresquen
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("retreat:attendance-updated", {
            detail: { retreat_id: retreatId },
          }),
        )
      }
    } catch (err) {
      console.error("Error al guardar asistentes:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="main flex flex-col gap-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">
          {convivencia.titulo || "Convivencia"}
        </h1>
        <p className="flex justify-center gap-3 text-neutral-600">
          <span>
            {convivencia.fecha_inicio ? transformDate(convivencia.fecha_inicio) : "--"}
          </span>
          <span>-</span>
          <span>
            {convivencia.fecha_fin ? transformDate(convivencia.fecha_fin) : "--"}
          </span>
          <span>/ 2026</span>
        </p>
        {viewTotals && (
          <p className="flex justify-center gap-4 mt-2 text-neutral-700 bg-neutral-200 w-max mx-auto px-4 py-2 rounded-full border border-neutral-400">
            <strong>Total personas: {estadisticas.total_personas}</strong>
            <span>Matrimonios: {estadisticas.total_matrimonios}</span>
            <span>Solteros: {estadisticas.total_solteros}</span>
            <span>Solteras: {estadisticas.total_solteras}</span>
          </p>
        )}
      </header>
      <div className="space-y-10">
        {grouped.map((parish) => (
          <section key={parish.parroquia} className="print-keep-with-table">
            <header>
              <h2 className="font-semibold text-2xl p-1 border-b-2 border-sky-600 text-sky-600">
                {parish.parroquia}
              </h2>
            </header>
            <div className="space-y-8 mt-6">
              {parish.comunidades.map((comm) => (
                <article key={comm.numero} className="print-keep-with-table-comm">
                  <h3 className="font-semibold text-lg mb-2 text-neutral-500">
                    Comunidad N° {comm.numero}
                  </h3>
                  <div className="container-table">
                    <table>
                      <thead>
                        <tr>
                          {headTable.map((item) => (
                            <th key={item}>{item}</th>
                          ))}
                          <th className="no-print">Asistió</th>
                        </tr>
                      </thead>
                      <tbody className="">
                        {comm.confirmados.map((bro) => {
                          const names = bro.nombres_confirmados.split(" y ")

                          return (
                            <tr
                              key={bro.group_key ?? bro.person_ids ?? bro.nombres_confirmados}
                              className="relative"
                            >
                              <td className="truncate max-w-60">
                                {bro.nombres_confirmados}
                              </td>
                              <td className="min capitalize">{bro.civil_status}</td>
                              <td className="col-full">{bro.observaciones_combinadas}</td>
                              <td className="min">{bro.retreat_house_name}</td>
                              <td className="min no-print">
                                {bro.civil_status === "matrimonio" && (
                                  <div className="flex items-center justify-center gap-1">
                                    {bro.person_ids.map((personId, index) => {
                                      const isSelected = selectedPersonIds.has(personId)
                                      const isFemale = index === 1
                                      const personName = names[index] ?? bro.nombres_confirmados

                                      return (
                                        <label
                                          key={personId}
                                          className="flex justify-center items-center relative cursor-pointer"
                                          title={personName}
                                        >
                                          <input
                                            type="checkbox"
                                            className="bg-red-500 absolute inset-0 cursor-pointer opacity-0"
                                            checked={isSelected}
                                            onChange={() => togglePersonSelection(personId)}
                                          />
                                          <UserIcon
                                            className="size-6 block"
                                            genre={isFemale ? "fem" : "masc"}
                                          />
                                          <div className="size-6 block">
                                            {isSelected && (
                                              <span className="animate-entry-checks pointer-events-none flex items-center justify-center">
                                                <CheckIcon className="size-full block text-sky-500" />
                                              </span>
                                            )}
                                          </div>
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                                {bro.civil_status !== "matrimonio" && bro.person_ids[0] != null && (
                                  <div className="content-asist flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      className="absolute inset-0 m-auto cursor-pointer opacity-0"
                                      checked={selectedPersonIds.has(bro.person_ids[0])}
                                      onChange={() => togglePersonSelection(bro.person_ids[0])}
                                    />
                                    {selectedPersonIds.has(bro.person_ids[0]) && (
                                      <span className="span-icon animate-entry-checks pointer-events-none">
                                        <CheckIcon className="size-6 block text-sky-500" />
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan={5}>
                            <div className="flex items-center justify-around">
                              <span>Total Personas: {comm.estadisticas.total_personas}</span>
                              <span>Total Matrimonios: {comm.estadisticas.total_matrimonios}</span>
                              <span>Total Solteros: {comm.estadisticas.total_solteros}</span>
                              <span>Total Solteras: {comm.estadisticas.total_solteras}</span>
                            </div>
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-8 no-print">
        <div className="flex items-center gap-4">
          <button className="btn w-full" type="button" onClick={handleToggleAll}>
            {allSelected ? "Desmarcar todos" : "Marcar todos"}
          </button>
          <button
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
            type="button"
            onClick={handleSaveAttendees}
            disabled={saving}
          >
            <SaveIcon className="size-5 block text-neutral-500" />
            <span>{saving ? "Guardando..." : "Guardar asistentes"}</span>
          </button>
          <a href={`/collect-money/${retreatId}`} className="btn btn-primary w-full flex items-center justify-center gap-2">
            <ReportMoneyIcon className="size-5 block text-white" />
            <span>Cobrar</span>
          </a>
        </div>
      </footer>

    </div>
  )
}
