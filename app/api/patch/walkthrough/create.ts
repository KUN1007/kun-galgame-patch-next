import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { createWalkthroughSchema } from '~/validations/walkthrough'
import type { PatchWalkthrough } from '~/types/api/patch'

export const createWalkthrough = async (
  input: z.infer<typeof createWalkthroughSchema>,
  uid: number
) => {
  const { patchId, name, content } = input

  const data = await prisma.patch_walkthrough.create({
    data: {
      patch_id: patchId,
      user_id: uid,
      name,
      content
    },
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
