import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { uploadPatchBanner } from '~/app/api/utils/uploadPatchBanner'
import { patchCreateSchema } from '~/validations/edit'
import { syncPatchFromApis } from '~/app/api/edit/sync'

export const createPatch = async (
  input: Omit<z.infer<typeof patchCreateSchema>, 'alias'> & {
    alias: string[]
  },
  uid: number
) => {
  const {
    vndbId,
    alias,
    banner,
    name_zh_cn,
    name_ja_jp,
    name_en_us,
    introduction_zh_cn,
    introduction_ja_jp,
    introduction_en_us,
    released,
    contentLimit
  } = input

  const bannerArrayBuffer = banner as ArrayBuffer

  const newId = await prisma.$transaction(
    async (tx) => {
      const patch = await tx.patch.create({
        data: {
          name_zh_cn,
          name_ja_jp,
          name_en_us,
          introduction_zh_cn,
          introduction_ja_jp,
          introduction_en_us,
          vndb_id: vndbId ? vndbId : null,
          user_id: uid,
          banner: '',
          released: released ? released : 'unknown',
          content_limit: contentLimit
        }
      })

      const newId = patch.id

      const res = await uploadPatchBanner(bannerArrayBuffer, newId)
      if (typeof res === 'string') {
        return res
      }
      const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/patch/${newId}/banner/banner.avif`

      await tx.patch.update({
        where: { id: newId },
        data: { banner: imageLink }
      })

      if (alias.length) {
        const aliasData = alias.map((name) => ({
          name,
          patch_id: newId
        }))
        await tx.patch_alias.createMany({
          data: aliasData,
          skipDuplicates: true
        })
      }

      await tx.user.update({
        where: { id: uid },
        data: {
          daily_image_count: { increment: 1 },
          moemoepoint: { increment: 3 }
        }
      })

      await tx.user_patch_contribute_relation.create({
        data: {
          user_id: uid,
          patch_id: newId
        }
      })

      return newId
    },
    { timeout: 60000 }
  )

  if (typeof newId === 'number') {
    await syncPatchFromApis(newId, vndbId || null)
  }

  return newId
}
