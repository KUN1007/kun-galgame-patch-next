import { NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import type { SumData } from '~/types/api/admin'

export const getSumData = async (): Promise<SumData> => {
  const [userCount, galgameCount, patchResourceCount, patchCommentCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.patch.count(),
      prisma.patch_resource.count(),
      prisma.patch_comment.count()
    ])

  return {
    userCount,
    galgameCount,
    patchResourceCount,
    patchCommentCount
  }
}

export const GET = async () => {
  const data = await getSumData()
  return NextResponse.json(data)
}
