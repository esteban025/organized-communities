import { PlusIcon, RefreshIcon, SearchIcon } from "@/icons/iconsReact"

type FilterInvitedProps = {
  value: string;
  onChange: (value: string) => void;
}

export const FilterInvited = ({ value, onChange }: FilterInvitedProps) => {
  return (
    <div className="content-input relative w-full max-w-75">
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
      <SearchIcon className="size-5 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300" />
      <button className="size-6 absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 p-1 bg-neutral-500 rounded-full justify-center items-center text-white cursor-pointer btn-clean-filter">
        <PlusIcon className="size-5 block transform rotate-45 " />
      </button>
    </div>
  );
}