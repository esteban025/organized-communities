import { RefreshIcon, SearchIcon } from "@/icons/iconsReact";

interface FilterParishProps {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
}

export const FilterParish = ({ value, onChange, onReset }: FilterParishProps) => {
  // filtrar por nombre o por localidad
  // localidad aun no implementada por el momento solo por nombre
  return (
    <div className="grid grid-cols-2 items-center">
      <div className="content-input relative">
        <input
          className={value.trim() ? "has-value" : "no-value"}
          type="text"
          id="filter-parish"
          name="filter-parish"
          placeholder="Buscar por nombre de parroquia..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        <SearchIcon className="size-5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300" />
      </div>
      <div className="content-actions self-end justify-end flex gap-2">
        <button
          type="button"
          className="btn btn-primary flex items-center gap-2"
          onClick={onReset}
        >
          <RefreshIcon className="size-5" />
          <span>Limpiar filtros</span>
        </button>
      </div>
    </div>
  );
}