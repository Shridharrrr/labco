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
    <form onSubmit={handleSubmit} className="mt-2">
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
        placeholder="Task title..."
        className="w-full bg-white dark:bg-[#14151b] border border-black/[0.1] dark:border-white/[0.1] rounded-lg px-3 py-2
          text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-xs outline-none resize-none
          focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="px-3 py-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Add task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
