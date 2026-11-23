import { useEffect } from 'react';
import useUIStore from '../../store/uiSlice';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '!',
};

function ToastItem({ toast }) {
  const { removeToast } = useUIStore();

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, removeToast]);

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border
        shadow-xl text-xs font-medium animate-[slideIn_0.15s_ease-out]
        bg-white dark:bg-[#111218] border-black/[0.08] dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100`}
    >
      <span
        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
          isError
            ? 'bg-rose-500/15 text-rose-500'
            : isSuccess
            ? 'bg-emerald-500/15 text-emerald-500'
            : 'bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'
        }`}
      >
        {ICONS[toast.type] || ICONS.info}
      </span>
      <span className="flex-1 min-w-0">
        {typeof toast.message === 'string'
          ? toast.message
          : toast.message?.message || JSON.stringify(toast.message || '')}
      </span>
      <button
        onClick={() => removeToast(toast.id)}
        className="opacity-40 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts } = useUIStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-1.5 w-72 pointer-events-auto">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
