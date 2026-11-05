// Server start-up hook (Next.js instrumentation). Last-resort logging so a
// crash outside a request (a stray promise, a timer) leaves a trace instead
// of disappearing — the process keeps running; Next handles request errors.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { logger } = await import('@/lib/logger');
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', { message: reason?.message || String(reason), stack: reason?.stack });
  });
  process.on('uncaughtExceptionMonitor', (err) => {
    logger.error('uncaught_exception', { message: err?.message, stack: err?.stack });
  });
}
