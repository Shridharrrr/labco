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
        bg-black/70 backdrop-blur-sm animate-[fadeIn_0.12s_ease-out]"
    >
      <div
        className="relative bg-[#111114] border border-white/[0.10] rounded-lg
          shadow-2xl shadow-black/60 w-full max-w-lg mx-4 animate-[modalIn_0.15s_ease-out]"
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.08]">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] active:scale-95"
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
