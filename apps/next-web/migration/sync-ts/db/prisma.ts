import { PrismaClient } from '@prisma/client'

// Shared Prisma client (single instance)
export const prisma = new PrismaClient()
