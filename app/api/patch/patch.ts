import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { uploadPatchBanner } from '../edit/_upload'
import { parsePatchBannerMiddleware } from './_middleware'
import { updatePatchBannerSchema } from '~/validations/patch'
import { createDedupMessage } from '~/server/utils/message'
import type { Patch } from '~/types/api/patch'

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
      created: String(patch.created),
      _count: patch._count
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

      await createDedupMessage({
        type: 'favorite',
        content: patch.name,
        sender_id: ctx.uid,
        recipient_id: patch.user_id,
        patch_id: patch.id
      })
    }

    return !existingFavorite
  })

export const updatePatchBanner = privateProcedure
  .use(parsePatchBannerMiddleware)
  .input(updatePatchBannerSchema)
  .mutation(async ({ ctx, input }) => {
    const bannerArrayBuffer = input.image as ArrayBuffer
    const res = await uploadPatchBanner(bannerArrayBuffer, input.patchId)
    if (!res) {
      return '上传图片错误, 未知错误'
    }
    if (typeof res === 'string') {
      return res
    }
  })
