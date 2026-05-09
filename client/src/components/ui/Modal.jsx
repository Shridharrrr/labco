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
        bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
    >
      <div
        className="relative bg-[#1a1928] border border-white/10 rounded-2xl
          shadow-2xl w-full max-w-lg mx-4 animate-[slideUp_0.2s_ease-out]"
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
