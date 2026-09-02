// Minimal structured logging — no external dependency. Emits single-line JSON
// in production (safe for a log aggregator / hosting platform's log stream),
// human-readable output in development. Swap the transport later (e.g. pino,
// a hosted sink) without changing any call site.

const isProd = process.env.NODE_ENV === 'production';

function emit(level, event, meta) {
  const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (isProd) {
    out(JSON.stringify({ level, event, time: new Date().toISOString(), ...meta }));
  } else {
    out(`[${level}] ${event}`, meta || '');
  }
}

export const logger = {
  info: (event, meta) => emit('info', event, meta),
  warn: (event, meta) => emit('warn', event, meta),
  error: (event, meta) => emit('error', event, meta)
};
