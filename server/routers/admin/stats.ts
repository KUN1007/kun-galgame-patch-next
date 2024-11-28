import { publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { setKv, getKv } from '~/lib/redis'
import type { AdminStats } from '~/types/api/admin'

const CACHE_KEY = 'admin:stats'

export const getAdminStats = publicProcedure.query(async () => {
  const cachedStats = await getKv(CACHE_KEY)

  if (cachedStats) {
    return JSON.parse(cachedStats)
  }

  const today = new Date()
  const startOfToday = new Date(today.setHours(0, 0, 0, 0))
  const endOfToday = new Date(today.setHours(23, 59, 59, 999))

  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0))
  const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999))

  const [
    totalUsers,
    totalPatches,
    todayComments,
    activeUsers,
    totalUsersYesterday,
    totalPatchesYesterday,
    yesterdayComments,
    activeUsersYesterday
  ] = await Promise.all([
    prisma.user.count(),
    prisma.patch.count(),
    prisma.patch_comment.count({
      where: {
        created: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    }),
    prisma.user.count({
      where: {
        last_login_time: {
          gte: (Date.now() - 24 * 60 * 60 * 1000).toString()
        }
      }
    }),
    prisma.user.count({
      where: {
        created: {
          gte: startOfYesterday,
          lte: endOfYesterday
        }
      }
    }),
    prisma.patch.count({
      where: {
        created: {
          gte: startOfYesterday,
          lte: endOfYesterday
        }
      }
    }),
    prisma.patch_comment.count({
      where: {
        created: {
          gte: startOfYesterday,
          lte: endOfYesterday
        }
      }
    }),
    prisma.user.count({
      where: {
        last_login_time: {
          gte: startOfYesterday.toString()
        }
      }
    })
  ])

  const stats: AdminStats[] = [
    {
      title: 'user',
      value: totalUsers.toString(),
      change: totalUsers - totalUsersYesterday
    },
    {
      title: 'patch',
      value: totalPatches.toString(),
      change: totalPatches - totalPatchesYesterday
    },
    {
      title: 'comment',
      value: todayComments.toString(),
      change: todayComments - yesterdayComments
    },
    {
      title: 'active',
      value: activeUsers.toString(),
      change: activeUsers - activeUsersYesterday
    }
  ]

  await setKv(CACHE_KEY, JSON.stringify(stats), 60 * 60)

  return stats
})
