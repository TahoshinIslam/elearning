// Small, safe Markdown → HTML for articles. Everything is HTML-escaped first;
// only the tags below are produced, and links/images must be http(s) or
// site-relative. Supports: ## / ### headings, paragraphs, **bold**, *italic*,
// `code`, [link](url), ![alt](url), - / 1. lists, > quotes, --- rules.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const safeUrl = (u) => {
  const v = String(u || '').trim();
  return /^(https?:\/\/|\/(?!\/))/i.test(v) ? v.replace(/"/g, '%22') : null;
};

function inline(text) {
  let s = esc(text);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    return u ? `<img src="${esc(u)}" alt="${alt}" loading="lazy" decoding="async">` : m;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    if (!u) return label;
    const ext = /^https?:/i.test(u);
    return `<a href="${esc(u)}"${ext ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}>${label}</a>`;
  });
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s;
}

export function slugHeading(t) {
  return String(t).toLowerCase().trim().replace(/[^a-z0-9ঀ-৿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

// → { html, headings: [{ level, text, id }] }
export function renderMarkdown(src) {
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const headings = [];
  let para = [];
  let list = null; // { type: 'ul'|'ol', items: [] }
  let quote = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushAll(); continue; }
    if ((m = /^(#{2,4})\s+(.+)$/.exec(line))) {
      flushAll();
      const level = Math.min(4, m[1].length);
      const text = m[2].trim();
      let id = slugHeading(text) || `h-${headings.length + 1}`;
      if (headings.some((h) => h.id === id)) id = `${id}-${headings.length + 1}`;
      headings.push({ level, text, id });
      out.push(`<h${level} id="${esc(id)}">${inline(text)}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flushAll(); out.push('<hr>'); continue; }
    if ((m = /^>\s?(.*)$/.exec(line))) { flushPara(); flushList(); quote.push(m[1]); continue; }
    if ((m = /^\s*[-*]\s+(.+)$/.exec(line))) { flushPara(); flushQuote(); if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = /^\s*\d+[.)]\s+(.+)$/.exec(line))) { flushPara(); flushQuote(); if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    flushList(); flushQuote();
    para.push(line.trim());
  }
  flushAll();
  return { html: out.join('\n'), headings };
}
