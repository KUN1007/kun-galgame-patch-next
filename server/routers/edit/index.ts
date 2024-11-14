import { router, privateProcedure } from '~/lib/trpc'
import {
  patchCreateSchema,
  patchUpdateSchema,
  duplicateSchema,
  imageSchema
} from '~/validations/edit'
import { uploadPatchBanner, uploadIntroductionImage } from './_upload'
import {
  parseCreatePatchFormDataMiddleware,
  parseEditorImageMiddleware
} from './_middleware'
import { generatePatchDiff } from './_helpers'
import { prisma } from '~/prisma/index'

export const editRouter = router({
  createPatch: privateProcedure
    .use(parseCreatePatchFormDataMiddleware)
    .input(patchCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, vndbId, alias, banner, introduction, released } = input

      const currentId: { last_value: number }[] =
        await prisma.$queryRaw`SELECT last_value FROM patch_id_seq`
      const newId = Number(currentId[0].last_value) + 1

      const bannerArrayBuffer = banner as ArrayBuffer
      const res = await uploadPatchBanner(bannerArrayBuffer, newId)
      if (!res) {
        return '上传图片错误, 未知错误'
      }
      if (typeof res === 'string') {
        return res
      }

      const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/patch/${newId}/banner/banner.avif`

      return await prisma.$transaction(async (prisma) => {
        const patch = await prisma.patch.create({
          data: {
            name,
            vndb_id: vndbId,
            alias: alias ? alias : [],
            introduction,
            user_id: ctx.uid,
            banner: imageLink,
            released
          }
        })

        await prisma.user.update({
          where: { id: ctx.uid },
          data: {
            daily_image_count: { increment: 1 },
            moemoepoint: { increment: 3 }
          }
        })

        await prisma.user_patch_contribute_relation.create({
          data: {
            user_id: ctx.uid,
            patch_id: patch.id
          }
        })

        await prisma.patch_history.create({
          data: {
            action: '创建了',
            type: '补丁',
            content: name,
            user_id: ctx.uid,
            patch_id: patch.id
          }
        })

        return patch.id
      })
    }),

  updatePatch: privateProcedure
    .input(patchUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, name, alias, introduction } = input

      const patch = await prisma.patch.findUnique({ where: { id } })
      if (!patch) {
        return '该 ID 下未找到对应补丁'
      }

      const lastPullRequest = await prisma.patch_pull_request.findFirst({
        where: { patch_id: id },
        orderBy: { index: 'desc' }
      })
      const newIndex = lastPullRequest ? lastPullRequest.index + 1 : 0

      return await prisma.$transaction(async (prisma) => {
        const diffContent = generatePatchDiff(patch, input)

        if (ctx.uid === patch.user_id) {
          await prisma.patch.update({
            where: { id },
            data: {
              name,
              alias: alias ? alias : [],
              introduction
            }
          })

          await prisma.patch_history.create({
            data: {
              action: '更新了',
              type: '补丁',
              content: diffContent,
              user_id: ctx.uid,
              patch_id: patch.id
            }
          })
        } else {
          await prisma.patch_pull_request.create({
            data: {
              index: newIndex,
              user_id: ctx.uid,
              patch_id: id,
              content: diffContent
            }
          })

          await prisma.patch_history.create({
            data: {
              action: '创建了',
              type: '更新请求',
              content: diffContent,
              user_id: ctx.uid,
              patch_id: patch.id
            }
          })
        }
      })
    }),

  duplicate: privateProcedure
    .input(duplicateSchema)
    .mutation(async ({ ctx, input }) => {
      const patch = await prisma.patch.findFirst({
        where: { vndb_id: input.vndbId }
      })
      if (patch) {
        return 'VNDB ID 重复, 本游戏已经被发布过了'
      }
    }),

  image: privateProcedure
    .use(parseEditorImageMiddleware)
    .input(imageSchema)
    .mutation(async ({ ctx, input }) => {
      const newFileName = `${ctx.uid}-${Date.now()}`

      const bannerArrayBuffer = input.image as ArrayBuffer
      const res = await uploadIntroductionImage(
        newFileName,
        bannerArrayBuffer,
        ctx.uid
      )
      if (!res) {
        return '上传图片错误, 未知错误'
      }
      if (typeof res === 'string') {
        return res
      }

      await prisma.user.update({
        where: { id: ctx.uid },
        data: { daily_image_count: { increment: 1 } }
      })

      const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/user_${ctx.uid}/patch/introduction/${newFileName}.avif`
      return { imageLink }
    })
})
