import { RefreshIcon, SearchIcon } from "@/icons/iconsReact"

export const FilterInvited = () => {
  return (
    <div className="filter-invited mb-4">
      <div className="content-input relative">
        <input
          id="filter-brother-name"
          type="text"
          className="input-text"
          placeholder=" "
        />
        <label htmlFor="filter-brother-name" className="label-text">
          Buscar por nombre
        </label>
        <SearchIcon className="size-5 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300" />

      </div>
    </div>
  );
}