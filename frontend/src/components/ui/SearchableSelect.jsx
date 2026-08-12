import { useState, useRef, useEffect } from "react";

// Drop-in replacement for a native <select> when the option list can get long.
// Usage:
//   <SearchableSelect
//     options={projectsData?.data?.map(p => ({ value: p._id, label: p.name })) || []}
//     value={selectedProjectId}
//     onChange={(val) => setSelectedProjectId(val)}
//     placeholder="Select project"
//   />
// Not a native <select>, so it can't be spread with react-hook-form's {...register(...)}.
// Pair it with a hidden input instead (see usage notes below the component).
const SearchableSelect = ({ options = [], value, onChange, placeholder = "Select...", disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center rounded-md border border-gray-300 px-3.5 py-2.5 text-sm text-left bg-white disabled:bg-gray-50 disabled:text-ink-400"
      >
        <span className={selected ? "text-ink-900" : "text-ink-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-ink-400 ml-2">▾</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-hidden flex flex-col">
          <input
            autoFocus
            placeholder="Search..."
            className="w-full px-3 py-2 text-sm border-b border-gray-100 outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="overflow-y-auto">
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-ink-400">No matches</p>}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  o.value === value ? "bg-gold-500/10 text-gold-600 font-medium" : "text-ink-900"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;