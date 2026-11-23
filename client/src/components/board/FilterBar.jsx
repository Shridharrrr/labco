import { useRef } from 'react';
import useUIStore from '../../store/uiSlice';
import useBoardStore from '../../store/boardSlice';
import { isFiltering } from '../../utils/filterCards';

const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'];

const DUE_OPTIONS = [
  { value: 'overdue', label: 'Overdue', color: 'text-rose-500' },
  { value: 'due_soon', label: 'Due soon', color: 'text-amber-500' },
  { value: 'no_date', label: 'No due date', color: 'text-zinc-500' },
];

export default function FilterBar() {
  const { filters, setFilter, clearFilters } = useUIStore();
  const { cards } = useBoardStore();
  const inputRef = useRef(null);

  const usedColors = [
    ...new Set(Object.values(cards).map((c) => c.coverColor).filter(Boolean)),
  ];
  const colorOptions = usedColors.length ? usedColors : LABEL_COLORS;
  const active = isFiltering(filters);

  const toggleCover = (color) => {
    const next = (filters.covers || []).includes(color)
      ? filters.covers.filter((c) => c !== color)
      : [...(filters.covers || []), color];
    setFilter('covers', next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-md text-xs">
      {/* Search */}
      <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 w-40 sm:w-52 transition-colors">
        <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Filter cards..."
          className="bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none flex-1"
        />
        {filters.search && (
          <button onClick={() => setFilter('search', '')} className="text-zinc-400 hover:text-black dark:hover:text-white">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="w-px h-4 bg-black/10 dark:bg-white/10" />

      {/* Cover Color filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Covers</span>
        <div className="flex items-center gap-1.5">
          {colorOptions.map((color) => {
            const isActive = (filters.covers || []).includes(color);
            return (
              <button
                key={color}
                onClick={() => toggleCover(color)}
                title={color}
                className="w-3.5 h-3.5 rounded-full transition-all hover:scale-125"
                style={{
                  background: color,
                  outline: isActive ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: '2px',
                  opacity: isActive ? 1 : 0.45,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="w-px h-4 bg-black/10 dark:bg-white/10" />

      {/* Due date filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Due</span>
        <div className="flex items-center gap-1">
          {DUE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter('dueDate', filters.dueDate === opt.value ? null : opt.value)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                filters.dueDate === opt.value
                  ? `${opt.color} bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15`
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {active && (
        <button
          onClick={clearFilters}
          className="ml-auto text-[11px] font-medium text-rose-500 hover:underline"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
