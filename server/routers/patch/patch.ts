import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/server/utils/markdownToHtml'
import type { Patch, PatchIntroduction } from '~/types/api/patch'

export const getPatchById = publicProcedure
  .input(
    z.object({
      id: z.number()
    })
  )
  .query(async ({ ctx, input }) => {
    const { id } = input

    const patch = await prisma.patch.findUnique({
      where: { id },
      include: {
        user: true,
        _count: {
          select: {
            favorite_by: true,
            contribute_by: true,
            resource: true,
            comment: true
          }
        },
        favorite_by: {
          where: {
            user_id: ctx.uid
          }
        }
      }
    })

    if (!patch) {
      return '未找到对应补丁'
    }

    await prisma.patch.update({
      where: { id: patch.id },
      data: { view: { increment: 1 } }
    })

    const response: Patch = {
      id: patch.id,
      name: patch.name,
      introduction: patch.introduction,
      banner: patch.banner,
      status: patch.status,
      view: patch.view,
      type: patch.type,
      language: patch.language,
      platform: patch.platform,
      alias: patch.alias,
      isFavorite: patch.favorite_by.length > 0,
      user: {
        id: patch.user.id,
        name: patch.user.name,
        avatar: patch.user.avatar
      },
      _count: patch._count
    }

    return response
  })

export const getPatchIntroduction = publicProcedure
  .input(
    z.object({
      patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input

    const patch = await prisma.patch.findUnique({
      where: { id: patchId }
    })
    if (!patch) {
      return '未找到对应补丁'
    }

    const response: PatchIntroduction = {
      vndbId: patch.vndb_id,
      introduction: await markdownToHtml(patch.introduction),
      alias: patch.alias,
      released: patch.released,
      created: String(patch.created),
      updated: String(patch.updated)
    }

    return response
  })

export const togglePatchFavorite = privateProcedure
  .input(
    z.object({
      patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { patchId } = input

    const patch = await prisma.patch.findUnique({
      where: { id: patchId }
    })
    if (!patch) {
      return '未找到补丁'
    }

    const existingFavorite =
      await prisma.user_patch_favorite_relation.findUnique({
        where: {
          user_id_patch_id: {
            user_id: ctx.uid,
            patch_id: patchId
          }
        }
      })

    if (existingFavorite) {
      await prisma.user_patch_favorite_relation.delete({
        where: {
          user_id_patch_id: {
            user_id: ctx.uid,
            patch_id: patchId
          }
        }
      })
    } else {
      await prisma.user_patch_favorite_relation.create({
        data: {
          user_id: ctx.uid,
          patch_id: patchId
        }
      })
    }

    if (patch.user_id !== ctx.uid) {
      await prisma.user.update({
        where: { id: patch.user_id },
        data: { moemoepoint: { increment: existingFavorite ? -1 : 1 } }
      })
    }

    return !existingFavorite
  })
