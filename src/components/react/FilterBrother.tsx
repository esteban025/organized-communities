import { RefreshIcon, SearchIcon } from "@/icons/iconsReact";

export const FilterBrother = ({
  name,
  onNameChange,
  selectedRoles,
  onRolesChange,
  onReset,
}: {
  name: string;
  onNameChange: (newValue: string) => void;
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  onReset: () => void;
}) => {

  const handleReset = () => {
    onNameChange("");
    onRolesChange([]);
    onReset();
  };

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="content-input relative">
        <input
          id="filter-brother-name"
          type="text"
          className="input-text"
          placeholder=" "
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <label htmlFor="filter-brother-name" className="label-text">
          Buscar por nombre
        </label>
        <SearchIcon className="size-5 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300" />

      </div>

      <button
        type="button"
        className="btn btn-secondary flex items-center gap-2"
        onClick={handleReset}
      >
        <RefreshIcon className="size-4 block" />
        <span>Limpiar filtros</span>
      </button>
    </div>
  );
};