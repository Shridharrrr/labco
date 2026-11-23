import { useEffect } from 'react';
import useUIStore from '../../store/uiSlice';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  error: 'bg-red-500/15 border-red-500/30 text-red-300',
  info: 'bg-brand-500/15 border-brand-500/30 text-brand-300',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
};

function ToastItem({ toast }) {
  const { removeToast } = useUIStore();

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, removeToast]);

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border
        shadow-lg shadow-black/30 text-[13px] font-medium animate-[slideIn_0.2s_ease-out]
        ${COLORS[toast.type] || COLORS.info}`}
    >
      <span className="text-sm">{ICONS[toast.type]}</span>
      <span>{typeof toast.message === 'string' ? toast.message : (toast.message?.message || JSON.stringify(toast.message || ''))}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts } = useUIStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-72">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
