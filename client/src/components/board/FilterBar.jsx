import { useRef, useEffect } from 'react';
import useUIStore from '../../store/uiSlice';
import useBoardStore from '../../store/boardSlice';
import { isFiltering } from '../../utils/filterCards';

const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'];

const DUE_OPTIONS = [
  { value: 'overdue',  label: 'Overdue',   color: 'text-red-400' },
  { value: 'due_soon', label: 'Due soon',  color: 'text-amber-400' },
  { value: 'no_date',  label: 'No due date', color: 'text-zinc-300' },
];

export default function FilterBar() {
  const { filters, setFilter, clearFilters } = useUIStore();
  const { cards } = useBoardStore();
  const inputRef = useRef(null);

  // Collect all unique cover colors used across all cards
  const usedColors = [...new Set(
    Object.values(cards).map((c) => c.coverColor).filter(Boolean)
  )];
  const colorOptions = usedColors.length ? usedColors : LABEL_COLORS;

  const active = isFiltering(filters);

  const toggleCover = (color) => {
    const next = (filters.covers || []).includes(color)
      ? filters.covers.filter((c) => c !== color)
      : [...(filters.covers || []), color];
    setFilter('covers', next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 border-b border-white/[0.05] bg-[#09090b]">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-md px-2.5 py-1.5 w-36 sm:w-48 focus-within:border-zinc-700 transition-colors">
        <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Search cards..."
          className="bg-transparent text-[11px] text-zinc-100 placeholder-zinc-500 outline-none flex-1"
        />
        {filters.search && (
          <button onClick={() => setFilter('search', '')} className="text-zinc-400 hover:text-white">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/[0.06]" />

      {/* Cover Color filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Covers</span>
        <div className="flex items-center gap-1">
          {colorOptions.map((color) => {
            const isActive = (filters.covers || []).includes(color);
            return (
              <button
                key={color}
                onClick={() => toggleCover(color)}
                title={color}
                className="w-3.5 h-3.5 rounded-sm transition-all hover:scale-125"
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

      {/* Divider */}
      <div className="w-px h-4 bg-white/[0.06]" />

      {/* Due date filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Due</span>
        <div className="flex items-center gap-1">
          {DUE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter('dueDate', filters.dueDate === opt.value ? null : opt.value)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                filters.dueDate === opt.value
                  ? `${opt.color} bg-white/[0.08] border border-white/[0.12]`
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/[0.06]" />

      {/* Checklist toggle */}
      <button
        onClick={() => setFilter('hasChecklist', !filters.hasChecklist)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
          filters.hasChecklist
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/15'
            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Has checklist
      </button>

      {/* Clear all */}
      {active && (
        <>
          <div className="w-px h-4 bg-white/[0.06]" />
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 transition-all"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            Clear filters
          </button>
        </>
      )}

      {/* Active filter count badge */}
      {active && (
        <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-brand-500/15 text-brand-400 rounded-md font-semibold">
          Filtered
        </span>
      )}
    </div>
  );
}
