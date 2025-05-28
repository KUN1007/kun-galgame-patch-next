export const register = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setKUNGalgameTask } = await import('~/server/cron')
    setKUNGalgameTask()
  }
}
