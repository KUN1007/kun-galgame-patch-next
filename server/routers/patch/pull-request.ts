import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/server/utils/markdownToHtml'
import type { PatchPullRequest } from '~/types/api/patch'

export const getPullRequest = publicProcedure
  .input(
    z.object({
      patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input

    const data = await prisma.patch_pull_request.findMany({
      where: { id: patchId },
      include: { user: true }
    })
    if (!data.length) {
      return []
    }

    const response: PatchPullRequest[] = await Promise.all(
      data.map(async (pr) => ({
        status: pr.status,
        index: pr.index,
        completeTime: pr.complete_time,
        content: await markdownToHtml(pr.content),
        user: {
          id: pr.user.id,
          name: pr.user.name,
          avatar: pr.user.avatar
        },
        created: String(pr.created)
      }))
    )

    return response
  })

export const mergePullRequest = privateProcedure
  .input(
    z.object({
      patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {})

export const declinePullRequest = privateProcedure
  .input(
    z.object({
      patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input
  })
