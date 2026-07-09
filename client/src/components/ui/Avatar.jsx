export default function Avatar({ name = '', src = '', color = '#6366f1', size = 'md' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };

  return (
    <div
      className={`${sizes[size]} rounded-md flex items-center justify-center
        font-semibold text-white ring-1 ring-[#09090b] select-none shrink-0`}
      style={{ background: src ? undefined : color }}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-md object-cover" />
      ) : (
        initials || '?'
      )}
    </div>
  );
}
