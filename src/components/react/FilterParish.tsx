import { PlusIcon, SearchIcon } from "@/icons/iconsReact";

interface FilterParishProps {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
}

export const FilterParish = ({ value, onChange, onReset }: FilterParishProps) => {
  return (
    <div className="grid grid-cols-2 items-center">
      <div className="content-input relative">
        <input
          className={value.trim() ? "has-value" : "no-value"}
          type="text"
          id="filter-parish"
          name="filter-parish"
          autoComplete="off"
          placeholder=" "
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        <label htmlFor="filter-parish" className="label-text">Buscar por nombre</label>
        <SearchIcon className="size-5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300 icon-search" />
        <button className=" size-6 absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 p-1 bg-neutral-500 rounded-full justify-center items-center text-white cursor-pointer btn-clean-filter" onClick={onReset}>
          <PlusIcon className="size-5 block transform rotate-45 " />
        </button>
      </div>
    </div>
  );
}