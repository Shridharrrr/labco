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
    <div className="shrink-0 w-[84vw] sm:w-72 bg-white dark:bg-[#0c0d12] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 shadow-xl">
      <form onSubmit={handleSubmit}>
        <input
          id="add-column-input"
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          placeholder="Column title..."
          className="w-full bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-md px-2.5 py-1.5
            text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs outline-none
            focus:border-black/20 dark:focus:border-white/20 transition-all"
        />
        <div className="flex gap-2 mt-2.5">
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
          >
            Add column
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1.5 text-zinc-400 hover:text-black dark:hover:text-white text-xs transition-colors rounded-md cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
