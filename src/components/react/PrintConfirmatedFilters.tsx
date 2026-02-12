import { RefreshIcon } from "@/icons/iconsReact"
import { useState } from "react"

interface FiltersProps {
  parishes: string[]
  communities: string[]
  retreatHouses: string[]
  selectedParish: string
  selectedCommunity: string
  selectedRetreatHouse: string
  onChangeParish: (value: string) => void
  onChangeCommunity: (value: string) => void
  onChangeRetreatHouse: (value: string) => void
  onClearFilters: () => void
  viewTotals: boolean
  onChangeViewTotals: (value: boolean) => void
}

export const PrintConfirmatedFilters = ({
  parishes,
  communities,
  retreatHouses,
  selectedParish,
  selectedCommunity,
  selectedRetreatHouse,
  onChangeParish,
  onChangeCommunity,
  onChangeRetreatHouse,
  onClearFilters,
  viewTotals,
  onChangeViewTotals,
}: FiltersProps) => {
  return (
    <form className="card-section flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <header>
        <h2 className="text-xl font-semibold mb-2">Filtros</h2>
      </header>
      <div className="ss">
        <label htmlFor="view-totals" className="flex items-center gap-2">
          <span>Mostrar Totales </span>
          <input
            type="checkbox"
            name="view-totals"
            id="view-totals"
            checked={viewTotals}
            onChange={(e) => onChangeViewTotals(e.target.checked)}
          />
        </label>
      </div>
      <div className="grid gap-2 grid-cols-4">
        <label className="flex flex-col gap-1" htmlFor="select-parish">
          <select
            name="select-parish"
            className="input select-input space-y-1"
            value={selectedParish}
            onChange={(e) => onChangeParish(e.target.value)}
          >
            <option value="" className="options-select">Todas las parroquias</option>
            {parishes.map((parish) => (
              <option key={parish} value={parish} className="options-select">
                {parish}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1" htmlFor="select-community">
          <select
            name="select-community"
            className="input select-input space-y-1"
            value={selectedCommunity}
            onChange={(e) => onChangeCommunity(e.target.value)}
          >
            <option value="" className="options-select">Todas las comunidades</option>
            {communities.map((num) => (
              <option key={num} value={num} className="options-select">
                Comunidad N° {num}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1" htmlFor="select-retreat-house">
          <select
            name="select-retreat-house"
            className="input select-input space-y-1"
            value={selectedRetreatHouse}
            onChange={(e) => onChangeRetreatHouse(e.target.value)}
          >
            <option value="" className="options-select">Todos los hospedajes</option>
            {retreatHouses.map((house) => (
              <option key={house} value={house} className="options-select">
                {house}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn-secondary flex justify-center items-center gap-2"
          onClick={onClearFilters}
        >
          <RefreshIcon className="size-5 block" />
          <span>Limpiar filtros</span>
        </button>
      </div>
    </form>
  )
}
