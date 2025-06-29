import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { readMessageSchema } from '~/validations/message'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'

export const readMessage = async (uid: number, type?: string) => {
  await prisma.user_message.updateMany({
    where: { recipient_id: uid, type },
    data: { status: { set: 1 } }
  })
  return {}
}

export const PUT = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  const input = await kunParsePutBody(req, readMessageSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const messageType = input.type === 'all' ? undefined : input.type

  const response = await readMessage(payload.uid, messageType)
  return NextResponse.json(response)
}
