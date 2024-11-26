import { prisma } from '~/prisma/index'
import { s3, uploadFileToS3, deleteFileFromS3 } from '~/lib/s3'
import { getKv } from '~/lib/redis'
import type { PatchResourceLink } from '~/types/api/patch'

export const createOrUpdatePatchResourceLink = async (
  patchId: number,
  patchResourceId: number,
  links: PatchResourceLink[]
) => {
  const validLinks = links.filter((link) => link.content !== '')

  const createLinks = validLinks.filter((link) => link.id === 0)
  const updateLinks = validLinks.filter((link) => link.id !== 0)

  let res: string | undefined

  if (createLinks.length > 0) {
    ;[res] = await Promise.all(
      createLinks.map(async (link) => {
        const fileHash = link.hash

        const filePath = await getKv(fileHash)
        if (!filePath) {
          return '本地临时文件存储未找到, 请重新上传'
        }
        const fileName = filePath.split('/').pop()

        // 上传文件到 S3
        const s3Key = `patch/${patchId}/${fileName}`
        // await uploadFileToS3(s3Key, filePath);

        await prisma.patch_resource_link.create({
          data: {
            type: link.type,
            hash: link.hash,
            content: link.content,
            patch_id: patchId,
            patch_resource_id: patchResourceId
          }
        })
      })
    )
  }

  if (updateLinks.length > 0) {
    ;[res] = await Promise.all(
      updateLinks.map(async (link) => {
        const fileHash = link.hash

        const filePath = await getKv(fileHash)
        if (!filePath) {
          return '本地临时文件存储未找到, 请重新上传'
        }
        const fileName = filePath.split('/').pop()

        // Upload new file to S3
        // const oldS3Key = `patch/${patchId}/${fileName}`
        // const newS3Key = `patch/${patchId}/${fileName}`

        // await Promise.all([
        //   deleteFileFromS3(oldS3Key),
        //   uploadFileToS3(newS3Key, filePath)
        // ])

        await prisma.patch_resource_link.update({
          where: {
            id: link.id
          },
          data: {
            type: link.type,
            hash: link.hash,
            content: link.content
          }
        })
      })
    )
  }

  if (res) {
    return res
  } else {
    const updatedLinks = await prisma.patch_resource_link.findMany({
      where: {
        patch_resource_id: patchResourceId
      },
      select: {
        id: true,
        type: true,
        hash: true,
        content: true
      }
    })

    return updatedLinks
  }
}
