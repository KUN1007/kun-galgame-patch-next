import cron from 'node-cron'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const isOlderThanOneDay = async (filePath: string): Promise<boolean> => {
  const stats = await fs.stat(filePath)
  const now = Date.now()
  const fileTime = stats.ctime.getTime()
  return now - fileTime > 24 * 60 * 60 * 1000
}

const deleteOldFilesAndFolders = async (dir: string) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await deleteOldFilesAndFolders(fullPath)

      const subEntries = await fs.readdir(fullPath)
      if (subEntries.length === 0) {
        await fs.rmdir(fullPath)
      }
    } else if (entry.isFile()) {
      if (await isOlderThanOneDay(fullPath)) {
        await fs.unlink(fullPath)
      }
    }
  }
}

export const setCleanupTask = cron.schedule('0 * * * *', async () => {
  const uploadsDir = path.posix.resolve('uploads')

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
  }

  try {
    await deleteOldFilesAndFolders(uploadsDir)
    console.log('Cleanup task completed.')
  } catch (error) {
    console.error('Error during cleanup task:', error)
  }
})
