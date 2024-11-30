import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createDedupMessage } from '~/app/api/utils/message'

const uidSchema = z.object({
  uid: z.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
})

export const followUser = async (uid: number, currentUserUid: number) => {
  if (uid === currentUserUid) {
    return '您不能关注自己'
  }

  return prisma.$transaction(async (prisma) => {
    await prisma.user_follow_relation.create({
      data: {
        follower_id: uid,
        following_id: currentUserUid
      }
    })

    await createDedupMessage({
      type: 'follow',
      content: '关注了您!',
      sender_id: currentUserUid,
      recipient_id: uid
    })
  })
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, uidSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await followUser(input.uid, payload?.uid)
  return NextResponse.json(response)
}