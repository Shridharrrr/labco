import { useState } from 'react';

export default function AddColumnForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onAdd(title.trim());
    setLoading(false);
    setTitle('');
  };

  return (
    <div className="shrink-0 w-[84vw] sm:w-72 bg-[#111114] border border-white/[0.10] rounded-xl p-3 shadow-xl" style={{ animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <form onSubmit={handleSubmit}>
        <input
          id="add-column-input"
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          placeholder="Column title..."
          className="w-full bg-white/[0.04] border border-white/[0.10] rounded-md px-3 py-2
            text-zinc-100 placeholder-zinc-500 text-sm outline-none
            focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-white/90 disabled:opacity-40 transition-all active:scale-[0.96]"
          >
            Add column
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] text-xs transition-all duration-200 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
