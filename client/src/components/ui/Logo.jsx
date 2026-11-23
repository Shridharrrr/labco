// Clean "L" lettermark logo for LabCo
export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) {
  const sizes = {
    xs: { box: 'w-6 h-6', fontSize: '13px', text: 'text-xs' },
    sm: { box: 'w-7 h-7', fontSize: '15px', text: 'text-sm' },
    md: { box: 'w-8 h-8', fontSize: '17px', text: 'text-sm' },
    lg: { box: 'w-10 h-10', fontSize: '21px', text: 'text-base' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Square tile with bold "L" */}
      <div
        className={`${currentSize.box} rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center shrink-0`}
      >
        <span
          style={{ fontSize: currentSize.fontSize, lineHeight: 1 }}
          className="font-black text-white dark:text-zinc-950 tracking-tighter"
        >
          L
        </span>
      </div>

      {showText && (
        <span
          className={`font-bold tracking-tight text-zinc-950 dark:text-white ${currentSize.text} ${textClassName}`}
        >
          LabCo
        </span>
      )}
    </div>
  );
}
