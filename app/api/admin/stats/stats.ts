import { prisma } from '~/prisma/index'

const getDateRange = (date: Date) => {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return { startOfDay, endOfDay }
}

export const getUserStats = async (date: Date) => {
  const { startOfDay, endOfDay } = getDateRange(date)

  return {
    totalUsers: await prisma.user.count({
      where: {
        created: {
          lte: endOfDay
        }
      }
    }),
    newUsers: await prisma.user.count({
      where: {
        created: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }),
    activeUsers: await prisma.user.count({
      where: {
        last_login_time: {
          gte: startOfDay.getTime().toString(),
          lte: endOfDay.getTime().toString()
        }
      }
    })
  }
}

export const getGalgameStats = async (date: Date) => {
  const { startOfDay, endOfDay } = getDateRange(date)

  return {
    totalGalgames: await prisma.patch.count({
      where: {
        created: {
          lte: endOfDay
        }
      }
    }),
    newGalgames: await prisma.patch.count({
      where: {
        created: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })
  }
}

export const getPatchResourceStats = async (date: Date) => {
  const { startOfDay, endOfDay } = getDateRange(date)

  return {
    totalPatches: await prisma.patch_resource.count({
      where: {
        created: {
          lte: endOfDay
        }
      }
    }),
    newPatches: await prisma.patch_resource.count({
      where: {
        created: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })
  }
}

export const getCommentStats = async (date: Date) => {
  const { startOfDay, endOfDay } = getDateRange(date)

  return await prisma.patch_comment.count({
    where: {
      created: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  })
}
