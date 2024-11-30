import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

export const getMessage = async (uid: number) => {
  const unread = await prisma.user_message.findFirst({
    where: { recipient_id: uid, status: 0 }
  })
  return unread
}

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await getMessage(payload.uid)
  return NextResponse.json(response)
}
