import { RefreshIcon } from "@/icons/iconsReact";

type ParityFilter = "all" | "even" | "odd";

export interface CommunityFilters {
  responsable: string;
  parity: ParityFilter;
  number: string;
  paso: string;
}

export const FilterCommunity = ({
  filters,
  onChange,
  onReset,
}: {
  filters: CommunityFilters;
  onChange: (filters: CommunityFilters) => void;
  onReset: () => void;
}) => {
  const handleInputChange = (
    field: keyof CommunityFilters,
    value: string,
  ) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="filter-card grid grid-cols-4 gap-3 items-center">
      <div className="content-input">
        <input
          type="text"
          value={filters.responsable}
          onChange={(e) => handleInputChange("responsable", e.target.value)}
          placeholder=" "
          autoComplete="off"
          name="responsable-search"
          id="responsable-search"
        />
        <label className="label-text" htmlFor="responsable-search">Responsable</label>
      </div>

      <div className="content-input">
        <input
          type="number"
          min={1}
          value={filters.number}
          onChange={(e) => handleInputChange("number", e.target.value)}
          placeholder=" "
          name="number-search"
          id="number-search"
        />
        <label className="label-text" htmlFor="number-search">N° comunidad</label>
      </div>

      <div className="content-input">
        <input
          type="text"
          value={filters.paso}
          onChange={(e) => handleInputChange("paso", e.target.value)}
          placeholder=" "
          autoComplete="off"
          name="paso-search"
          id="paso-search"
        />
        <label className="label-text" htmlFor="paso-search">Paso</label>
      </div>

      <button
        type="button"
        className="btn btn-secondary flex items-center gap-2 ml-auto"
        onClick={onReset}
      >
        <RefreshIcon className="size-5 icon-btn" />
        Resetear filtros
      </button>
    </div>
  );
};