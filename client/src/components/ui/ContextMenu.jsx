import { useState, useRef, useEffect } from 'react';

/**
 * Generic dropdown context menu.
 * Pass `items` as an array of { label, icon?, onClick, danger? }
 */
export default function ContextMenu({ items, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={menuRef} className="relative" onClick={e => e.stopPropagation()}>
      {/* Trigger */}
      <div onClick={() => setOpen(v => !v)}>{children}</div>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute z-50 top-full mt-1 min-w-[160px] bg-[#1a1a1a] border border-white/[0.08]
            rounded-xl shadow-2xl shadow-black/50 py-1 animate-[fadeIn_0.1s_ease-out]
            ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="my-1 border-t border-white/[0.06]" />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left
                  ${item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  }`}
              >
                {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
