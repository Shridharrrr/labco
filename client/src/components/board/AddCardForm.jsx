import { useState } from 'react';

export default function AddCardForm({ onAdd, onCancel }) {
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
    <form onSubmit={handleSubmit} className="mt-1.5">
      <textarea
        id="add-card-input"
        autoFocus
        rows={2}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Card title..."
        className="w-full bg-[#161619] border border-white/[0.12] rounded-lg px-3 py-2
          text-zinc-100 placeholder-zinc-500 text-sm outline-none resize-none
          focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
      />
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-md text-xs font-medium transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none active:scale-95"
        >
          Add card
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
  );
}
