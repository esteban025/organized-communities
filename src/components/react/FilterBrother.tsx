import { PlusIcon, SearchIcon } from "@/icons/iconsReact";

interface FilterBrotherProps {
  name: string;
  onNameChange: (newValue: string) => void;
  onReset: () => void;
}
export const FilterBrother = ({
  name,
  onNameChange,
  onReset,
}: FilterBrotherProps) => {

  const handleReset = () => {
    onNameChange("");
    onReset();
  };

  return (
    <div className="content-input relative w-full max-w-lg">
      <input
        id="filter-brother-name-invited"
        type="text"
        className="input-text"
        placeholder=" "
        autoComplete="off"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
      />
      <label htmlFor="filter-brother-name-invited" className="label-text">
        Buscar por nombre
      </label>
      <SearchIcon className="size-5 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300" />
      <button className="size-6 absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 p-1 bg-neutral-500 rounded-full justify-center items-center text-white cursor-pointer btn-clean-filter" onClick={handleReset}>
        <PlusIcon className="size-5 block transform rotate-45 " />
      </button>
    </div>
  );
};