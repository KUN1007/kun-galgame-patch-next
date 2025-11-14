import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceCreateSchema } from '~/validations/patch'
import { uploadPatchResource } from './_helper'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { CreateMessageType } from '~/types/api/message'
import type { PatchResourceHtml } from '~/types/api/patch'

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
    modelName,
    ...resourceData
  } = input

  const currentPatch = await prisma.patch.findUnique({
    where: { id: patchId },
    select: {
      name_en_us: true,
      name_ja_jp: true,
      name_zh_cn: true,
      type: true,
      language: true,
      platform: true,
      favorite_by: {
        include: {
          user: {
            select: {
              id: true
            }
          }
        }
      }
    }
  })
  if (!currentPatch) {
    return '未找到该补丁对应的 Galgame 信息, 请确认 Galgame 存在'
  }

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
          model_name: modelName,
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
          resource_update_time: new Date(),
          type: { set: updatedTypes },
          language: { set: updatedLanguages },
          platform: { set: updatedPlatforms }
        }
      })

      const favoritePatchUserUid = currentPatch.favorite_by.map(
        (like) => like.user.id
      )
      const galgameName = getPreferredLanguageText({
        'en-us': currentPatch.name_en_us,
        'ja-jp': currentPatch.name_ja_jp,
        'zh-cn': currentPatch.name_zh_cn
      })
      const noticeMessageData: CreateMessageType[] = favoritePatchUserUid.map(
        (favoriteUid) => {
          return {
            type: 'patchResourceCreate',
            content: `${newResource.user.name} 在您收藏的 Galgame ${galgameName} 下创建了新的补丁资源\n🎁 ${newResource.name ?? newResource.note.slice(0, 50)}`,
            sender_id: uid,
            recipient_id: favoriteUid,
            link: `/patch/${patchId}/resource`
          }
        }
      )
      await prisma.user_message.createMany({
        data: noticeMessageData,
        skipDuplicates: true
      })

      const resource: PatchResourceHtml = {
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
        download: 0,
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

      return resource
    },
    { timeout: 60000 }
  )
}
