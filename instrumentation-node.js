// Last-resort logging so a crash outside a request (a stray promise, a timer)
// leaves a trace instead of disappearing. Next handles request errors itself.
import { logger } from '@/lib/logger';

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { message: reason?.message || String(reason), stack: reason?.stack });
});
process.on('uncaughtExceptionMonitor', (err) => {
  logger.error('uncaught_exception', { message: err?.message, stack: err?.stack });
});
