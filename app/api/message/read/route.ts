import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

export const readMessage = async (uid: number) => {
  await prisma.user_message.updateMany({
    where: { recipient_id: uid },
    data: { status: { set: 1 } }
  })
  return {}
}

export const PUT = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await readMessage(payload.uid)
  return NextResponse.json(response)
}
