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
    <div className="shrink-0 w-72 bg-white/5 border border-white/10 rounded-2xl p-3">
      <form onSubmit={handleSubmit}>
        <input
          id="add-column-input"
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          placeholder="Column title..."
          className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2
            text-white placeholder-white/30 text-sm outline-none
            focus:border-brand-500/70 focus:ring-1 focus:ring-brand-500/30 transition-all"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm
              font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Add column
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-white/50 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
