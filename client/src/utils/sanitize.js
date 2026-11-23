/**
 * Safe markdown parser and sanitizer.
 * Protects against Stored and Reflected XSS by:
 * 1. Strictly escaping all HTML characters (&, <, >, ", ')
 * 2. Allowing only safe http:// and https:// URL protocols
 * 3. Safely generating HTML tags for formatting
 */

export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Only allow absolute http:// or https://, or relative anchor links starting with #
  return /^https?:\/\/[^\s"'<>]+$/i.test(trimmed) || /^#[a-zA-Z0-9_-]+$/.test(trimmed);
}

export function sanitizeUrl(url) {
  if (!isSafeUrl(url)) return '#';
  return escapeHtml(url.trim());
}

/**
 * Parses markdown into safe HTML.
 * @param {string} text 
 * @param {object} options - { inlineOnly?: boolean }
 * @returns {string} Safe HTML string
 */
export function parseSafeMarkdown(text, options = {}) {
  if (!text || typeof text !== 'string') return '';

  // 1. First escape all raw HTML characters completely
  let html = escapeHtml(text);

  // 2. Code blocks (multiline)
  if (!options.inlineOnly) {
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
      return `<pre class="bg-black/40 p-3 rounded-md my-3 overflow-x-auto font-mono text-xs text-zinc-200"><code>${code}</code></pre>`;
    });
  }

  // 3. Inline code `code`
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    return `<code class="bg-white/10 text-brand-300 px-1 py-0.5 rounded text-[12px] font-mono">${code}</code>`;
  });

  // 4. Headings
  if (!options.inlineOnly) {
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold mt-4 mb-2 text-white/90">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold mt-5 mb-2 text-white border-b border-white/10 pb-1.5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mt-6 mb-3 text-white border-b border-white/10 pb-2">$1</h1>');
  }

  // 5. Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white/90">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-zinc-300">$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em class="italic text-zinc-300">$1</em>');

  // 6. Explicit markdown links [text](url) - strictly validate URL protocol
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    const cleanUrl = url.trim();
    if (isSafeUrl(cleanUrl)) {
      return `<a href="${sanitizeUrl(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline hover:text-brand-300 transition-colors">${linkText}</a>`;
    }
    return linkText; // Discard unsafe URL, keep text
  });

  // 7. Standalone raw URLs (http:// or https://)
  html = html.replace(/(^|[^"])((https?:\/\/)[^\s<]+)/g, (match, prefix, url) => {
    // If preceded by href=, skip
    if (match.includes('href=')) return match;
    if (isSafeUrl(url)) {
      return `${prefix}<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline hover:text-brand-300 transition-colors">${url}</a>`;
    }
    return match;
  });

  // 8. Blockquotes & Lists
  if (!options.inlineOnly) {
    html = html.replace(/^\&gt; (.*$)/gim, '<blockquote class="border-l-2 border-brand-500/50 pl-3 py-0.5 my-2 text-white/70 bg-brand-500/5 rounded-r">$1</blockquote>');
    html = html.replace(/^\s*[-*+] (.*$)/gim, '<li class="ml-5 list-disc marker:text-white/30 text-zinc-300">$1</li>');
    html = html.replace(/(<li class="ml-5 list-disc marker:text-white\/30 text-zinc-300">.*?<\/li>(?:\s*<br\s*\/?>|\n)*)+/g, match => `<ul class="my-2 space-y-1">${match}</ul>`);
  }

  // 9. Paragraphs and Line breaks
  if (!options.inlineOnly) {
    html = html.split(/\n\n+/).map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<ul') || trimmed.startsWith('<blockquote')) {
        return trimmed;
      }
      return `<p class="mb-2 leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
    }).join('');
  } else {
    html = html.replace(/\n/g, '<br />');
  }

  return html;
}

