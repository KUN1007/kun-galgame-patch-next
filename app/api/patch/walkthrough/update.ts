import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { updateWalkthroughSchema } from '~/validations/walkthrough'
import type { PatchWalkthrough } from '~/types/api/patch'

export const updateWalkthrough = async (
  input: z.infer<typeof updateWalkthroughSchema>,
  uid: number
) => {
  const { walkthroughId, name, content } = input
  const walkthrough = await prisma.patch_walkthrough.findUnique({
    where: { id: walkthroughId }
  })
  if (!walkthrough) {
    return '未找到该攻略'
  }
  if (walkthrough.user_id !== uid) {
    return '您没有权限更改该攻略'
  }

  const data = await prisma.patch_walkthrough.update({
    where: { id: walkthroughId, user_id: uid },
    data: { name, content },
    include: {
      user: {
        select: {
          _count: {
            select: { patch_walkthrough: true }
          },
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  })

  const newWalkthrough: PatchWalkthrough = {
    id: data.id,
    name: data.name,
    content: data.content,
    created: data.created,
    user: data.user,
    _count: {
      patch_walkthrough: data.user._count.patch_walkthrough
    }
  }

  return newWalkthrough
}
