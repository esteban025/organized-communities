import { useMemo, useState } from "react"
import { PrintConfirmatedFilters } from "./PrintConfirmatedFilters"
import { PrintConfirmatedList } from "./PrintConfirmatedList"

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

interface StatsData {
  total_personas: number
  total_matrimonios: number
  total_solteros: number
  total_solteras: number
}

interface ViewPrintConfirmatedProps {
  retreatId: number
  parroquias: ParishData[]
  headTable: string[]
  convivencia: ConvData
  estadisticas: StatsData
  attendedPersonIds: number[]
}

export const ViewPrintConfirmated = ({
  retreatId,
  parroquias,
  headTable,
  convivencia,
  estadisticas,
  attendedPersonIds,
}: ViewPrintConfirmatedProps) => {
  const [parish, setParish] = useState("")
  const [community, setCommunity] = useState("")
  const [hospedaje, setHospedaje] = useState("")

  const {
    parishesOptions,
    communitiesOptions,
    retreatHousesOptions,
    filteredGrouped,
  } = useMemo(() => {
    const parishesSet = new Set<string>()
    const communitiesSet = new Set<string>()
    const retreatHousesSet = new Set<string>()

    for (const parishItem of parroquias) {
      const parishName = String(parishItem.parroquia).trim()

      // Siempre agregamos todas las parroquias como opción
      parishesSet.add(parishName)

      // Para comunidades y hospedajes, filtramos por la parroquia/comunidad seleccionada
      const isParishSelected = !!parish
      const matchesSelectedParish = !isParishSelected || parishName === parish.trim()

      if (!matchesSelectedParish) continue

      for (const comm of parishItem.comunidades) {
        const commNumber = String(comm.numero).trim()
        const isCommunitySelected = !!community
        const matchesSelectedCommunity =
          !isCommunitySelected || commNumber === community.trim()

        // Opciones de comunidades: solo de la parroquia seleccionada (si hay una)
        communitiesSet.add(commNumber)

        // Opciones de hospedajes: respetan filtros de parroquia y comunidad
        if (!matchesSelectedCommunity) continue

        for (const bro of comm.confirmados) {
          if (bro.retreat_house_name) {
            retreatHousesSet.add(String(bro.retreat_house_name).trim())
          }
        }
      }
    }

    const parishesOptions = Array.from(parishesSet).sort((a, b) => a.localeCompare(b))
    const communitiesOptions = Array.from(communitiesSet).sort((a, b) => a.localeCompare(b))
    const retreatHousesOptions = Array.from(retreatHousesSet).sort((a, b) => a.localeCompare(b))

    const filteredGrouped = parroquias
      .map((parishItem) => {
        const parishName = String(parishItem.parroquia).trim()
        if (parish && parishName !== parish.trim()) return null

        const filteredCommunities = parishItem.comunidades
          .map((comm) => {
            const commNumber = String(comm.numero).trim()
            if (community && commNumber !== community.trim()) {
              return null
            }

            const filteredConfirmados = comm.confirmados.filter((bro) => {
              const houseName = bro.retreat_house_name
                ? String(bro.retreat_house_name).trim()
                : ""

              if (hospedaje && houseName !== hospedaje.trim()) {
                return false
              }
              return true
            })

            if (filteredConfirmados.length === 0) return null

            return { ...comm, confirmados: filteredConfirmados }
          })
          .filter((comm): comm is CommunityData => comm !== null)

        if (filteredCommunities.length === 0) return null

        return { ...parishItem, comunidades: filteredCommunities }
      })
      .filter((parishItem): parishItem is ParishData => parishItem !== null)

    return { parishesOptions, communitiesOptions, retreatHousesOptions, filteredGrouped }
  }, [parroquias, parish, community, hospedaje])

  const hasFilters = Boolean(parish || community || hospedaje)

  return (
    <div className="flex flex-col gap-9 w-full max-w-3xl mx-auto">
      <header className="no-print">
        <PrintConfirmatedFilters
          parishes={parishesOptions}
          communities={communitiesOptions}
          retreatHouses={retreatHousesOptions}
          selectedParish={parish}
          selectedCommunity={community}
          selectedRetreatHouse={hospedaje}
          onChangeParish={(value) => {
            setParish(value)
            // Al cambiar de parroquia reiniciamos la comunidad seleccionada
            setCommunity("")
          }}
          onChangeCommunity={setCommunity}
          onChangeRetreatHouse={setHospedaje}
          onClearFilters={() => {
            setParish("")
            setCommunity("")
            setHospedaje("")
          }}
        />
      </header>

      {filteredGrouped.length === 0 ? (
        <p className="message-card">
          {hasFilters
            ? "No hay hermanos que coincidan con los filtros seleccionados."
            : "No hay hermanos confirmados para esta convivencia."}
        </p>
      ) : (
        <PrintConfirmatedList
          retreatId={retreatId}
          grouped={filteredGrouped}
          headTable={headTable}
          convivencia={convivencia}
          estadisticas={estadisticas}
          attendedPersonIds={attendedPersonIds}
        />
      )}
    </div>
  )
}

