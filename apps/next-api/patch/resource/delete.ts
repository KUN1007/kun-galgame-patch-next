import { z } from 'zod'
import { deletePatchResource } from './_helper'
import { prisma } from '~/prisma/index'
import { _removeSubsequenceOnceAndDeduplicate } from './_helper'

const resourceIdSchema = z.object({
  resourceId: z.coerce
    .number({ message: '资源 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export const deleteResource = async (
  input: z.infer<typeof resourceIdSchema>,
  uid: number
) => {
  const patchResource = await prisma.patch_resource.findUnique({
    where: {
      id: input.resourceId,
      user_id: uid
    }
  })
  if (!patchResource) {
    return '未找到对应的资源'
  }
  if (patchResource.user_id !== uid) {
    return '您没有权限删除该补丁资源'
  }

  if (patchResource.storage === 's3') {
    await deletePatchResource(
      patchResource.content,
      patchResource.patch_id,
      patchResource.hash
    )
  }

  const patchType = await prisma.patch.findUnique({
    where: { id: patchResource.patch_id },
    select: {
      resource: {
        select: {
          type: true
        }
      }
    }
  })
  const patchTypeArray = patchType!.resource.map((r) => r.type).flat()
  const newTypeArray = _removeSubsequenceOnceAndDeduplicate(
    patchTypeArray,
    patchResource.type
  )

  return await prisma.$transaction(async (prisma) => {
    await prisma.user.update({
      where: { id: uid },
      data: { moemoepoint: { increment: -3 } }
    })

    await prisma.patch.update({
      where: { id: patchResource.patch_id },
      data: { type: newTypeArray }
    })

    await prisma.patch_resource.delete({
      where: { id: input.resourceId }
    })
    return {}
  })
}
