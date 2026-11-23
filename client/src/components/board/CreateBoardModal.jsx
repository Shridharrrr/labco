import { useState, useEffect, useRef } from 'react';
import Spinner from '../ui/Spinner';

const ACCENT_COLORS = [
  { name: 'Indigo',  value: '#6366f1', ring: 'ring-indigo-500' },
  { name: 'Cyan',    value: '#06b6d4', ring: 'ring-cyan-500'   },
  { name: 'Emerald', value: '#10b981', ring: 'ring-emerald-500'},
  { name: 'Amber',   value: '#f59e0b', ring: 'ring-amber-500'  },
  { name: 'Rose',    value: '#f43f5e', ring: 'ring-rose-500'   },
  { name: 'Purple',  value: '#a855f7', ring: 'ring-purple-500' },
];

export default function CreateBoardModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const inputRef   = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setError('');
      setAccentColor(ACCENT_COLORS[0].value);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) { setError('Title is required'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onCreate({ title: cleanTitle, description: description.trim(), background: accentColor, accentColor });
      onClose();
    } catch (err) {
      const msg = typeof err?.response?.data?.message === 'string'
        ? err.response.data.message
        : (err?.message || 'Failed to create project');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.12s_ease-out]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[400px] rounded-xl bg-white dark:bg-[#111218] border border-black/[0.07] dark:border-white/[0.08] shadow-xl relative text-zinc-900 dark:text-white animate-[modalIn_0.15s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.07]">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            New workspace
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {error && (
            <p className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </p>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
              Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Marketing Q4, Mobile App v2"
              className="w-full px-3 py-2 rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
              Description <span className="normal-case tracking-normal font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              className="w-full px-3 py-2 rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
            />
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Color
            </label>
            <div className="flex items-center gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setAccentColor(c.value)}
                  className={`w-5 h-5 rounded-full transition-all ${
                    accentColor === c.value
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#111218] ' + c.ring
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-35 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
