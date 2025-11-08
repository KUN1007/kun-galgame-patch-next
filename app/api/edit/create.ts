import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { uploadPatchBanner } from '~/app/api/utils/uploadPatchBanner'
import { patchCreateSchema } from '~/validations/edit'

export const createPatch = async (
  input: Omit<z.infer<typeof patchCreateSchema>, 'alias'> & {
    alias: string[]
  },
  uid: number
) => {
  const { name, vndbId, alias, banner, introduction, released, contentLimit } =
    input

  const bannerArrayBuffer = banner as ArrayBuffer

  return await prisma.$transaction(
    async (prisma) => {
      const patch = await prisma.patch.create({
        data: {
          name,
          vndb_id: vndbId ? vndbId : null,
          introduction,
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

      await prisma.patch.update({
        where: { id: newId },
        data: { banner: imageLink }
      })

      if (alias.length) {
        const aliasData = alias.map((name) => ({
          name,
          patch_id: newId
        }))
        await prisma.patch_alias.createMany({
          data: aliasData,
          skipDuplicates: true
        })
      }

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
          patch_id: newId
        }
      })

      return newId
    },
    { timeout: 60000 }
  )
}
