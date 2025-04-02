import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { createWalkthroughSchema } from '~/validations/walkthrough'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
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
    markdown: data.content,
    content: await markdownToHtml(data.content),
    created: data.created,
    updated: data.updated,
    user: data.user,
    _count: {
      patch_walkthrough: data.user._count.patch_walkthrough
    }
  }

  return newWalkthrough
}
