import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import { getPatchHistorySchema } from '~/validations/patch'
import type { PatchHistory } from '~/types/api/patch'

export const getPatchHistory = async (
  input: z.infer<typeof getPatchHistorySchema>
) => {
  const { patchId, page, limit } = input
  const offset = (page - 1) * limit

  const data = await prisma.patch_history.findMany({
    where: { patch_id: patchId },
    include: {
      user: true
    },
    orderBy: { created: 'desc' },
    take: limit,
    skip: offset
  })

  const histories: PatchHistory[] = await Promise.all(
    data.map(async (history) => ({
      id: history.id,
      action: history.action,
      type: history.type,
      content: await markdownToHtml(history.content),
      userId: history.user_id,
      patchId: history.patch_id,
      created: String(history.created),
      updated: String(history.updated),
      user: {
        id: history.user.id,
        name: history.user.name,
        avatar: history.user.avatar
      }
    }))
  )

  const total = await prisma.patch_history.count({
    where: { patch_id: patchId }
  })

  return { histories, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getPatchHistorySchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchHistory(input)
  return NextResponse.json(response)
}
