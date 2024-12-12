import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { uploadPatchBanner } from './_upload'
import { patchCreateSchema } from '~/validations/edit'

export const createPatch = async (
  input: Omit<z.infer<typeof patchCreateSchema>, 'alias'> & {
    alias: string[]
  },
  uid: number
) => {
  const { name, vndbId, alias, banner, introduction, released } = input

  const lastPatch = await prisma.patch.findFirst({
    orderBy: { id: 'desc' }
  })
  const nextId = lastPatch ? lastPatch.id + 1 : 1

  const bannerArrayBuffer = banner as ArrayBuffer
  const res = await uploadPatchBanner(bannerArrayBuffer, nextId)
  if (!res) {
    return '上传图片错误, 未知错误'
  }
  if (typeof res === 'string') {
    return res
  }

  const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/patch/${nextId}/banner/banner.avif`

  return await prisma.$transaction(async (prisma) => {
    const patch = await prisma.patch.create({
      data: {
        name,
        vndb_id: vndbId,
        alias: alias ? alias : [],
        introduction,
        user_id: uid,
        banner: imageLink,
        released
      }
    })

    await prisma.user.update({
      where: { id: uid },
      data: {
        daily_image_count: { increment: 1 },
        moemoepoint: { increment: 3 }
      }
    })

    await prisma.user_patch_contribute_relation.create({
      data: {
        user_id: uid,
        patch_id: patch.id
      }
    })

    await prisma.patch_history.create({
      data: {
        action: 'create',
        type: 'galgame',
        content: name,
        user_id: uid,
        patch_id: patch.id
      }
    })

    return patch.id
  })
}
