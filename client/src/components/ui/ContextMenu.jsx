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
    <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Trigger */}
      <div onClick={() => setOpen((v) => !v)}>{children}</div>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute z-50 top-full mt-1 min-w-[150px] bg-white dark:bg-[#111218] border border-black/[0.08] dark:border-white/[0.08]
            rounded-lg shadow-xl py-1 animate-[fadeIn_0.1s_ease-out]
            ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="my-1 border-t border-black/[0.06] dark:border-white/[0.06]" />
            ) : (
              <button
                key={i}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors text-left cursor-pointer
                  ${item.danger
                    ? 'text-rose-500 hover:bg-rose-500/10'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                {item.icon && <span className="w-3.5 h-3.5 shrink-0 text-zinc-400">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
