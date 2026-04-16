import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateDailyUploadSize() {
  try {
    console.log('Starting migration...')

    await prisma.$executeRaw`UPDATE "user" SET "daily_upload_size" = "daily_upload_size" * 1024 * 1024;`

    console.log('Data conversion completed.')

    await prisma.$executeRaw`ALTER TABLE "user" ALTER COLUMN "daily_upload_size" SET DATA TYPE INT;`

    console.log('Column type updated to INT.')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateDailyUploadSize()
