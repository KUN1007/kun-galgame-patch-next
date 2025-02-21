import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceCreateSchema } from '~/validations/patch'
import { uploadLargeFileToS3 } from '~/lib/s3/uploadLargeFileToS3'
import { uploadSmallFileToS3 } from '~/lib/s3/uploadSmallFileToS3'
import { getKv } from '~/lib/redis'
import { MAX_SMALL_FILE_SIZE } from '~/config/upload'
import type { PatchResource } from '~/types/api/patch'
import type { KunChunkMetadata } from '~/types/api/upload'

const uploadPatchResource = async (patchId: number, hash: string) => {
  const fileMetadataString = await getKv(hash)
  if (!fileMetadataString) {
    return '本地临时文件元数据未找到, 请重新上传补丁文件'
  }
  const fileMetadata = JSON.parse(fileMetadataString) as KunChunkMetadata
  const fileName = fileMetadata.filepath.split('/').pop()

  const s3Key = `patch/${patchId}/${hash}/${fileName}`
  let res
  if (fileMetadata.fileSize < MAX_SMALL_FILE_SIZE) {
    res = await uploadSmallFileToS3(s3Key, fileMetadata.filepath)
  } else {
    res = await uploadLargeFileToS3(s3Key, fileMetadata.filepath)
  }
  if (typeof res === 'string') {
    return res
  }

  const downloadLink = `${process.env.KUN_VISUAL_NOVEL_S3_STORAGE_URL!}/${s3Key}`
  return { downloadLink }
}

export const createPatchResource = async (
  input: z.infer<typeof patchResourceCreateSchema>,
  uid: number
) => {
  const {
    patchId,
    type,
    language,
    platform,
    content,
    storage,
    ...resourceData
  } = input

  const currentPatch = await prisma.patch.findUnique({
    where: { id: patchId },
    select: {
      type: true,
      language: true,
      platform: true
    }
  })

  let res: string
  if (storage === 'user') {
    res = content
  } else {
    const result = await uploadPatchResource(patchId, resourceData.hash)
    if (typeof result === 'string') {
      return result
    }
    res = result.downloadLink
  }

  return await prisma.$transaction(
    async (prisma) => {
      const newResource = await prisma.patch_resource.create({
        data: {
          patch_id: patchId,
          user_id: uid,
          type,
          language,
          platform,
          content: res,
          storage,
          ...resourceData
        },
        include: {
          user: {
            include: {
              _count: {
                select: { patch_resource: true }
              }
            }
          }
        }
      })

      await prisma.user.update({
        where: { id: uid },
        data: { moemoepoint: { increment: 3 } }
      })

      if (currentPatch) {
        const updatedTypes = [...new Set(currentPatch.type.concat(type))]
        const updatedLanguages = [
          ...new Set(currentPatch.language.concat(language))
        ]
        const updatedPlatforms = [
          ...new Set(currentPatch.platform.concat(platform))
        ]

        await prisma.patch.update({
          where: { id: patchId },
          data: {
            type: { set: updatedTypes },
            language: { set: updatedLanguages },
            platform: { set: updatedPlatforms }
          }
        })
      }

      const resource: PatchResource = {
        id: newResource.id,
        storage: newResource.storage,
        size: newResource.size,
        type: newResource.type,
        language: newResource.language,
        note: newResource.note,
        hash: newResource.hash,
        content: newResource.content,
        code: newResource.code,
        password: newResource.password,
        platform: newResource.platform,
        likeCount: 0,
        isLike: false,
        status: newResource.status,
        userId: newResource.user_id,
        patchId: newResource.patch_id,
        created: String(newResource.created),
        user: {
          id: newResource.user.id,
          name: newResource.user.name,
          avatar: newResource.user.avatar,
          patchCount: newResource.user._count.patch_resource
        }
      }

      return resource
    },
    { timeout: 60000 }
  )
}
