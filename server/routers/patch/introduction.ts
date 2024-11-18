import { z } from 'zod'
import { privateProcedure, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/server/utils/markdownToHtml'
import { patchTagAddSchema } from '~/validations/patch'
import type { PatchIntroduction } from '~/types/api/patch'

export const getPatchIntroduction = publicProcedure
  .input(
    z.object({
      patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input

    const patch = await prisma.patch.findUnique({
      where: { id: patchId },
      include: {
        tag: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                count: true,
                alias: true
              }
            }
          }
        }
      }
    })
    if (!patch) {
      return '未找到对应补丁'
    }

    const response: PatchIntroduction = {
      vndbId: patch.vndb_id,
      introduction: await markdownToHtml(patch.introduction),
      released: patch.released,
      alias: patch.alias,
      tag: patch.tag.map((tag) => tag.tag),
      created: String(patch.created),
      updated: String(patch.updated)
    }

    return response
  })

export const handleAddPatchTag = privateProcedure
  .input(patchTagAddSchema)
  .mutation(async ({ ctx, input }) => {
    const { patchId, tagId } = input

    const user = await prisma.user.findUnique({
      where: { id: ctx.uid }
    })
    if (!user) {
      return '未找到用户'
    }

    const relationData = tagId.map((id) => ({
      patch_id: patchId,
      tag_id: id
    }))

    const tags = await prisma.patch_tag.findMany({
      where: { id: { in: tagId } },
      select: { name: true }
    })
    const tagsNameArray = tags.map((t) => t.name)

    return await prisma.$transaction(async (prisma) => {
      await prisma.patch_tag_relation.createMany({
        data: relationData
      })

      await prisma.patch_history.create({
        data: {
          action: '更新了',
          type: '标签',
          content: tagsNameArray.toString(),
          user_id: ctx.uid,
          patch_id: patchId
        }
      })
    })
  })
