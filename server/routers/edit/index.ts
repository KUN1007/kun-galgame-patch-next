import { router, privateProcedure } from '~/lib/trpc'
import { patchSchema, duplicateSchema, imageSchema } from '~/validations/edit'
import { uploadPatchBanner, uploadIntroductionImage } from './_upload'
import {
  parseEditFormDataMiddleware,
  parseEditorImageMiddleware
} from './_middleware'
import { prisma } from '~/prisma/index'

export const editRouter = router({
  edit: privateProcedure
    .use(parseEditFormDataMiddleware)
    .input(patchSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, vndbId, alias, banner, introduction } = input

      // await ctx.prisma.$executeRaw`ALTER SEQUENCE patch_id_seq RESTART WITH 1`
      // await ctx.prisma
      //   .$executeRaw`ALTER SEQUENCE patch_history_id_seq RESTART WITH 1`

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
            banner: imageLink
          }
        })

        await prisma.user.update({
          where: { id: ctx.uid },
          data: {
            daily_image_count: { increment: 1 },
            moemoepoint: { increment: 1 }
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

      const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/user_${ctx.uid}/patch/introduction/${newFileName}.avif`
      return { imageLink }
    })
})
