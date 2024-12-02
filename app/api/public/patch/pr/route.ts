import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import type { PatchPullRequest } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const getPullRequest = async (input: z.infer<typeof patchIdSchema>) => {
  const { patchId } = input

  const data = await prisma.patch_pull_request.findMany({
    where: { patch_id: patchId },
    include: { user: true },
    orderBy: { created: 'desc' }
  })
  if (!data.length) {
    return []
  }

  const response: PatchPullRequest[] = await Promise.all(
    data.map(async (pr) => ({
      id: pr.id,
      status: pr.status,
      index: pr.index,
      completeTime: pr.complete_time,
      content: await markdownToHtml(pr.diff_content),
      note: pr.note,
      user: {
        id: pr.user.id,
        name: pr.user.name,
        avatar: pr.user.avatar
      },
      created: String(pr.created)
    }))
  )

  return response
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPullRequest(input)
  return NextResponse.json(response)
}
