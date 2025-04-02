import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceUpdateSchema } from '~/validations/patch'
import { uploadPatchResource, deletePatchResource } from './_helper'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import type { CreateMessageType } from '~/types/api/message'
import type { PatchResourceHtml } from '~/types/api/patch'

export const updatePatchResource = async (
  input: z.infer<typeof patchResourceUpdateSchema>,
  uid: number
) => {
  const { resourceId, patchId, content, modelName, ...resourceData } = input
  const resource = await prisma.patch_resource.findUnique({
    where: { id: resourceId }
  })
  if (!resource) {
    return '未找到该资源'
  }
  if (resource.user_id !== uid) {
    return '您没有权限更改该补丁资源'
  }

  const currentPatch = await prisma.patch.findUnique({
    where: { id: patchId },
    select: {
      name: true,
      type: true,
      language: true,
      platform: true
    }
  })
  if (!currentPatch) {
    return '未找到该补丁对应的 Galgame 信息, 请确认 Galgame 存在'
  }

  let newContent: string
  if (resource.storage === 'user' || resource.content === content) {
    newContent = content
  } else {
    await deletePatchResource(
      resource.content,
      resource.patch_id,
      resource.hash
    )
    const result = await uploadPatchResource(patchId, resourceData.hash)
    if (typeof result === 'string') {
      return result
    }
    newContent = result.downloadLink
  }

  return await prisma.$transaction(
    async (prisma) => {
      const newResource = await prisma.patch_resource.update({
        where: { id: resourceId, user_id: uid },
        data: {
          content: newContent,
          model_name: modelName,
          update_time: new Date(),
          ...resourceData
        },
        include: {
          like_by: {
            include: {
              user: {
                select: {
                  id: true
                }
              }
            }
          },
          user: {
            include: {
              _count: {
                select: { patch_resource: true }
              }
            }
          }
        }
      })

      const updatedTypes = [
        ...new Set(currentPatch.type.concat(resourceData.type))
      ]
      const updatedLanguages = [
        ...new Set(currentPatch.language.concat(resourceData.language))
      ]
      const updatedPlatforms = [
        ...new Set(currentPatch.platform.concat(resourceData.platform))
      ]

      await prisma.patch.update({
        where: { id: patchId },
        data: {
          resource_update_time: new Date(),
          type: { set: updatedTypes },
          language: { set: updatedLanguages },
          platform: { set: updatedPlatforms }
        }
      })

      if (resource.content !== content || resource.note !== resourceData.note) {
        const likeResourceUserUid = newResource.like_by.map(
          (like) => like.user.id
        )
        const noticeString =
          resource.content !== content
            ? '更新了补丁的下载资源'
            : '更新了补丁资源的备注信息'
        const noticeMessageData: CreateMessageType[] = likeResourceUserUid.map(
          (likeUid) => {
            return {
              type: 'patchResourceUpdate',
              content: `${newResource.user.name} 更您收藏的 Galgame (${currentPatch.name}) 下的补丁资源 ${newResource.name ?? newResource.note.slice(0, 50)}\n✨ ${noticeString}`,
              sender_id: uid,
              recipient_id: likeUid,
              link: `/patch/${patchId}/resource`
            }
          }
        )
        await prisma.user_message.createMany({
          data: noticeMessageData,
          skipDuplicates: true
        })
      }

      const resourceResponse: PatchResourceHtml = {
        id: newResource.id,
        storage: newResource.storage,
        name: newResource.name,
        modelName: newResource.model_name,
        size: newResource.size,
        type: newResource.type,
        language: newResource.language,
        note: newResource.note,
        noteHtml: await markdownToHtml(newResource.note),
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
        updateTime: newResource.update_time,
        user: {
          id: newResource.user.id,
          name: newResource.user.name,
          avatar: newResource.user.avatar,
          patchCount: newResource.user._count.patch_resource
        }
      }

      return resourceResponse
    },
    { timeout: 60000 }
  )
}
