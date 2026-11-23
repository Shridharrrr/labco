// Bespoke geometric logo mark for LabCo
export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) {
  const sizes = {
    xs: { box: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-xs' },
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-sm' },
    md: { box: 'w-8 h-8', icon: 'w-4.5 h-4.5', text: 'text-sm' },
    lg: { box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometric Hex-Prism Mark */}
      <div
        className={`${currentSize.box} rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-white/[0.08] dark:to-white/[0.02] border border-black/[0.08] dark:border-white/[0.12] p-1.5 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${currentSize.icon} transform -rotate-12`}
        >
          <defs>
            <linearGradient id="labco-grad-1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="0.5" stopColor="#818cf8" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="labco-grad-2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4f46e5" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/* Intersecting kinetic dynamic planes forming modern L + C mark */}
          <path
            d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
            stroke="url(#labco-grad-1)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 3V12L20 16.5"
            stroke="url(#labco-grad-1)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 12L4 16.5"
            stroke="url(#labco-grad-2)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.2" fill="#818cf8" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center gap-1 leading-none">
          <span
            className={`font-bold tracking-tight text-zinc-950 dark:text-white ${currentSize.text} ${textClassName}`}
          >
            LabCo
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5" />
        </div>
      )}
    </div>
  );
}
