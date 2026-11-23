import { useEffect, useRef } from 'react';

export default function Modal({ children, onClose, title }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center
        bg-black/60 backdrop-blur-sm animate-[fadeIn_0.1s_ease-out]"
    >
      <div
        className="relative bg-white dark:bg-[#0f1015] border border-black/[0.08] dark:border-white/[0.08] rounded-xl
          shadow-2xl w-full max-w-lg mx-4 animate-[modalIn_0.15s_ease-out] text-zinc-900 dark:text-zinc-100"
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.07]">
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
