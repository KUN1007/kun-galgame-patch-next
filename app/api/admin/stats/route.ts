import { NextRequest, NextResponse } from 'next/server'
import { getKv, setKv } from '~/lib/redis'
import type { AdminStats } from '~/types/api/admin'
import {
  getUserStats,
  getGalgameStats,
  getPatchResourceStats,
  getCommentStats
} from './stats'

const CACHE_KEY = 'admin:stats'

export const getAdminStats = async () => {
  const cachedStats = await getKv(CACHE_KEY)

  if (cachedStats) {
    return JSON.parse(cachedStats)
  }

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [
    todayUserStats,
    yesterdayUserStats,
    todayGalgameStats,
    todayPatchResourceStats,
    todayComments,
    yesterdayComments
  ] = await Promise.all([
    getUserStats(today),
    getUserStats(yesterday),
    getGalgameStats(today),
    getPatchResourceStats(today),
    getCommentStats(today),
    getCommentStats(yesterday)
  ])

  const stats: AdminStats[] = [
    {
      title: 'user',
      value: todayUserStats.totalUsers.toString(),
      change: todayUserStats.newUsers
    },
    {
      title: 'active',
      value: todayUserStats.activeUsers.toString(),
      change: todayUserStats.activeUsers - yesterdayUserStats.activeUsers
    },
    {
      title: 'galgame',
      value: todayGalgameStats.totalGalgames.toString(),
      change: todayGalgameStats.newGalgames
    },
    {
      title: 'patch',
      value: todayPatchResourceStats.totalPatches.toString(),
      change: todayPatchResourceStats.newPatches
    },
    {
      title: 'comment',
      value: todayComments.toString(),
      change: todayComments - yesterdayComments
    }
  ]

  await setKv(CACHE_KEY, JSON.stringify(stats), 60 * 60)

  return stats
}

export async function GET(req: NextRequest) {
  const stats = await getAdminStats()
  return NextResponse.json(stats)
}
