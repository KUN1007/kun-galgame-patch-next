'use server'

import { prisma } from '~/prisma/index'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import { GalgameCardSelectField } from '~/constants/api/select'
import type { RankingUser } from '~/types/api/ranking'

// TODO:
export const getUserRanking = async (
  sortBy: string = 'moemoepoint',
  timeRange: string = 'all'
) => {
  let orderBy = {}
  switch (sortBy) {
    case 'moemoepoint':
      orderBy = { moemoepoint: 'desc' }
      break
    case 'patch':
      orderBy = { patch: { _count: 'desc' } }
      break
    case 'resource':
      orderBy = { patch_resource: { _count: 'desc' } }
      break
    case 'comment':
      orderBy = { patch_comment: { _count: 'desc' } }
      break
    default:
      orderBy = { moemoepoint: 'desc' }
  }

  const data = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      avatar: true,
      moemoepoint: true,
      _count: {
        select: {
          patch: true,
          patch_resource: true,
          patch_comment: true
        }
      }
    },
    orderBy,
    take: 60
  })

  const users = data.map((user) => ({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    moemoepoint: user.moemoepoint,
    patchCount: user._count.patch,
    resourceCount: user._count.patch_resource,
    commentCount: user._count.patch_comment
  }))

  return users
}

export const getPatchRanking = async (
  sortBy: string = 'view',
  timeRange: string = 'all'
) => {
  const nsfwEnable = await getNSFWHeader()

  let orderBy = {}
  switch (sortBy) {
    case 'view':
      orderBy = { view: 'desc' }
      break
    case 'download':
      orderBy = { download: 'desc' }
      break
    case 'favorite':
      orderBy = { favorite_by: { _count: 'desc' } }
      break
    default:
      orderBy = { view: 'desc' }
  }

  const data = await prisma.patch.findMany({
    where: {
      status: 0,
      ...nsfwEnable
    },
    select: GalgameCardSelectField,
    orderBy,
    take: 60
  })

  const galgames: GalgameCard[] = data.map((g) => ({
    ...g,
    name: {
      'en-us': g.name_en_us,
      'ja-jp': g.name_ja_jp,
      'zh-cn': g.name_zh_cn
    }
  }))

  return galgames
}
