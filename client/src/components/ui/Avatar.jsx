import { useState, useEffect } from 'react';

// Generates a pleasant, consistent background gradient for users without photos
function getAvatarGradient(name = '') {
  const gradients = [
    'from-indigo-600 to-violet-700',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-700',
    'from-rose-600 to-pink-700',
    'from-amber-600 to-orange-700',
    'from-fuchsia-600 to-purple-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function getInitials(name = '') {
  let safeName = '';
  if (typeof name === 'string') {
    safeName = name;
  } else if (name && typeof name === 'object') {
    safeName = name.name || name.email || '';
  } else {
    safeName = String(name || '');
  }

  if (!safeName) return '?';
  
  // If email, use first letters of username
  if (safeName.includes('@')) {
    const username = safeName.split('@')[0];
    const parts = username.replace(/[._-]/g, ' ').trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  }

  const parts = safeName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name = '',
  src = '',
  color,
  size = 'md',
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const safeName = typeof name === 'string'
    ? name
    : (name && typeof name === 'object' ? (name.name || name.email || 'User') : String(name || 'User'));

  const initials = getInitials(safeName);
  const gradient = getAvatarGradient(safeName);

  const sizes = {
    '2xs': 'w-5 h-5 text-[9px]',
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const showImg = Boolean(src && !imgError);

  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-md flex items-center justify-center font-semibold text-white ring-1 ring-white/10 select-none shrink-0 overflow-hidden relative shadow-xs ${
        !showImg && !color ? `bg-gradient-to-br ${gradient}` : ''
      } ${className}`}
      style={{
        backgroundColor: !showImg && color ? color : undefined,
      }}
      title={typeof name === 'string' ? name : (name?.name || name?.email || '')}
    >
      {showImg ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium leading-none">{initials}</span>
      )}
    </div>
  );
}
