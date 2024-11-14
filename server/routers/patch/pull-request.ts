import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/server/utils/markdownToHtml'
import { declinePullRequestSchema } from '~/validations/patch'
import type { PatchPullRequest } from '~/types/api/patch'
import type { PatchUpdate } from '../edit/_updates'

export const getPullRequest = publicProcedure
  .input(
    z.object({
      patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input

    const data = await prisma.patch_pull_request.findMany({
      where: { patch_id: patchId },
      include: { user: true }
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
      prId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .mutation(async ({ ctx, input }) => {
    const pullRequest = await prisma.patch_pull_request.findUnique({
      where: { id: input.prId }
    })
    if (!pullRequest) {
      return '未找到这个更新请求'
    }

    const updates = JSON.parse(pullRequest.content) as PatchUpdate

    return await prisma.$transaction(async (prisma) => {
      await prisma.patch.update({
        where: { id: pullRequest.patch_id },
        data: {
          name: updates.name,
          introduction: updates.introduction,
          alias: updates.alias
        }
      })

      await prisma.patch_pull_request.update({
        where: { id: input.prId },
        data: {
          complete_time: String(Date.now()),
          diff_content: '',
          content: '',
          status: 1
        }
      })

      await prisma.patch_history.create({
        data: {
          action: '合并了',
          type: '更新请求',
          content: `#${pullRequest.index}`,
          user_id: ctx.uid,
          patch_id: pullRequest.patch_id
        }
      })

      const contribute = await prisma.user_patch_contribute_relation.findFirst({
        where: { user_id: pullRequest.user_id, patch_id: pullRequest.patch_id }
      })
      if (!contribute) {
        await prisma.user_patch_contribute_relation.create({
          data: { user_id: pullRequest.user_id, patch_id: pullRequest.patch_id }
        })
      }
    })
  })

export const declinePullRequest = privateProcedure
  .input(declinePullRequestSchema)
  .mutation(async ({ ctx, input }) => {
    const pullRequest = await prisma.patch_pull_request.findUnique({
      where: { id: input.prId }
    })
    if (!pullRequest) {
      return '未找到这个更新请求'
    }

    return await prisma.$transaction(async (prisma) => {
      await prisma.patch_pull_request.update({
        where: { id: input.prId },
        data: {
          complete_time: String(Date.now()),
          diff_content: '',
          content: '',
          status: 2,
          note: input.note
        }
      })

      await prisma.patch_history.create({
        data: {
          action: '拒绝了',
          type: '更新请求',
          content: `# ${pullRequest.index}`,
          user_id: ctx.uid,
          patch_id: pullRequest.patch_id
        }
      })
    })
  })
