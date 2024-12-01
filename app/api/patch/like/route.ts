import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createDedupMessage } from '~/app/api/utils/message'

const patchIdSchema = z.object({
  patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
})

export const togglePatchFavorite = async (
  input: z.infer<typeof patchIdSchema>,
  uid: number
) => {
  const { patchId } = input

  const patch = await prisma.patch.findUnique({
    where: { id: patchId }
  })
  if (!patch) {
    return '未找到补丁'
  }

  const existingFavorite = await prisma.user_patch_favorite_relation.findUnique(
    {
      where: {
        user_id_patch_id: {
          user_id: uid,
          patch_id: patchId
        }
      }
    }
  )

  if (existingFavorite) {
    await prisma.user_patch_favorite_relation.delete({
      where: {
        user_id_patch_id: {
          user_id: uid,
          patch_id: patchId
        }
      }
    })
  } else {
    await prisma.user_patch_favorite_relation.create({
      data: {
        user_id: uid,
        patch_id: patchId
      }
    })
  }

  if (patch.user_id !== uid) {
    await prisma.user.update({
      where: { id: patch.user_id },
      data: { moemoepoint: { increment: existingFavorite ? -1 : 1 } }
    })

    await createDedupMessage({
      type: 'favorite',
      content: patch.name,
      sender_id: uid,
      recipient_id: patch.user_id,
      patch_id: patch.id
    })
  }

  return !existingFavorite
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await togglePatchFavorite(input, payload.uid)
  return NextResponse.json(response)
}
