import React from 'react';

export const isImage = (name = '') => /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(name);
export const isPdf   = (name = '') => /\.pdf$/i.test(name);
export const isDoc   = (name = '') => /\.(docx?|odt|rtf)$/i.test(name);
export const isSheet = (name = '') => /\.(xlsx?|csv|ods)$/i.test(name);
export const isCode  = (name = '') => /\.(js|ts|jsx|tsx|py|json|html|css|md|txt)$/i.test(name);

export function fileColor(name) {
  if (isImage(name)) return 'text-sky-400';
  if (isPdf(name))   return 'text-rose-400';
  if (isDoc(name))   return 'text-blue-400';
  if (isSheet(name)) return 'text-emerald-400';
  return 'text-white/40';
}

export function FileTypeIcon({ name, className = 'w-6 h-6' }) {
  if (isImage(name)) return (
    <svg className={`${className} text-sky-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
  if (isPdf(name)) return (
    <svg className={`${className} text-rose-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h2m2 0h2M9 17h6" />
    </svg>
  );
  if (isDoc(name)) return (
    <svg className={`${className} text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6M9 17h4" />
    </svg>
  );
  // generic
  return (
    <svg className={`${className} text-white/30`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
