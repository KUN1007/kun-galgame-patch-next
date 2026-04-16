export const log = {
  info: (...args: any[]) => console.log('[sync]', ...args),
  warn: (...args: any[]) => console.warn('[sync]', ...args),
  error: (...args: any[]) => console.error('[sync]', ...args)
}
