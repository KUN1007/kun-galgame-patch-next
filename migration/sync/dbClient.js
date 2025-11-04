import { PrismaClient } from '@prisma/client'

/**
 * Shared Prisma client for sync scripts.
 * Notes:
 * - Kept as a single instance to reuse connection pool.
 * - Close with prisma.$disconnect() where appropriate (e.g., in syncFromApis.mjs).
 */
export const prisma = new PrismaClient()

/*
可优化的地方：
- 允许通过环境变量配置日志级别（query/info/warn/error）；
- 若长时间运行，可考虑启用中断保护与连接健康检查。
*/
