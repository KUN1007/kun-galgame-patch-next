import { NextRequest, NextResponse } from 'next/server'
import { getKv, setKv } from '~/lib/redis'
import type { AdminStats } from '~/types/api/admin'
import { getUserStats, getPatchStats, getCommentStats } from './stats'

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
    todayPatchStats,
    todayComments,
    yesterdayComments
  ] = await Promise.all([
    getUserStats(today),
    getUserStats(yesterday),
    getPatchStats(today),
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
      title: 'patch',
      value: todayPatchStats.totalPatches.toString(),
      change: todayPatchStats.newPatches
    },
    {
      title: 'comment',
      value: todayComments.toString(),
      change: todayComments - yesterdayComments
    },
    {
      title: 'active',
      value: todayUserStats.activeUsers.toString(),
      change: todayUserStats.activeUsers - yesterdayUserStats.activeUsers
    }
  ]

  await setKv(CACHE_KEY, JSON.stringify(stats), 60 * 60)

  return stats
}

export async function GET(req: NextRequest) {
  const stats = await getAdminStats()
  return NextResponse.json(stats)
}
