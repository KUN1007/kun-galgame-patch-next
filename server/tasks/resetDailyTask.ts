import { prisma } from '~/prisma'
import cron from 'node-cron'

export const resetDailyTask = cron.schedule('0 0 * * *', async () => {
  await prisma.user.updateMany({
    data: {
      daily_image_count: 0,
      daily_check_in: 0,
      daily_upload_size: 0
    }
  })
})
