// Server start-up hook (Next.js instrumentation): process-level error logging
// on the Node runtime only (see instrumentation-node.js).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./instrumentation-node');
}
