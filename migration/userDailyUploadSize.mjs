import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateDailyUploadSize() {
  try {
    console.log('Starting migration...')

    // Step 1: 更新所有用户的数据，将 MB 转换为 Byte（避免精度丢失）
    await prisma.$executeRaw`UPDATE "user" SET "daily_upload_size" = "daily_upload_size" * 1024 * 1024;`

    console.log('Data conversion completed.')

    // Step 2: 修改数据库字段类型
    await prisma.$executeRaw`ALTER TABLE "user" ALTER COLUMN "daily_upload_size" SET DATA TYPE INT;`

    console.log('Column type updated to INT.')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 执行迁移
migrateDailyUploadSize()
