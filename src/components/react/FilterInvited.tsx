import { PlusIcon, SearchIcon } from "@/icons/iconsReact"

type FilterInvitedProps = {
  value: string;
  onChange: (value: string) => void;
  communityNumber: string;
  onCommunityNumberChange: (value: string) => void;
}

export const FilterInvited = ({ value, onChange, communityNumber, onCommunityNumberChange }: FilterInvitedProps) => {
  const handleClearFilters = () => {
    onChange("");
    onCommunityNumberChange("");
  };

  return (
    <div className="flex gap-4 w-full">
      <div className="content-input relative flex-1">
        <input
          id="filter-brother-name"
          type="text"
          className="input-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
        />
        <label htmlFor="filter-brother-name" className="label-text">
          Buscar por nombre
        </label>
        <SearchIcon className="icon-search size-5 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300" />
      </div>

      <div className="content-input relative flex-1">
        <input
          id="filter-community-number"
          type="number"
          className="input-text"
          value={communityNumber}
          onChange={(e) => onCommunityNumberChange(e.target.value)}
          placeholder=" "
        />
        <label htmlFor="filter-community-number" className="label-text">
          Número de comunidad
        </label>
      </div>

      <button
        type="button"
        onClick={handleClearFilters}
        className="btn btn-secondary"
        title="Limpiar filtros"
      >
        <PlusIcon className="size-5 block transform rotate-45" />
      </button>
    </div>
  );
}