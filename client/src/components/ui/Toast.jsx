import { useEffect } from 'react';
import useUIStore from '../../store/uiSlice';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS = {
  success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  error: 'bg-red-500/20 border-red-500/40 text-red-300',
  info: 'bg-brand-500/20 border-brand-500/40 text-brand-300',
  warning: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
};

function ToastItem({ toast }) {
  const { removeToast } = useUIStore();

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, removeToast]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md
        shadow-lg text-sm font-medium animate-[slideIn_0.25s_ease-out]
        ${COLORS[toast.type] || COLORS.info}`}
    >
      <span className="text-base">{ICONS[toast.type]}</span>
      <span>{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts } = useUIStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
