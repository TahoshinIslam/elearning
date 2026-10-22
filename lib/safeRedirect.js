// Only same-site relative paths are allowed as post-login destinations
// (blocks open redirects like ?returnTo=https://evil.example or //evil).
export function safeReturnTo(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\') || /[\u0000-\u001f]/.test(v)) return fallback;
  if (/^\/(login|register|forgot|reset)(\/|\?|$)/.test(v)) return fallback;
  return v.slice(0, 500);
}
