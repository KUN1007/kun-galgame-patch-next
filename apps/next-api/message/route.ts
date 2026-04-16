import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { createMessage } from '~/app/api/utils/message'
import { createMessageSchema } from '~/validations/message'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

export const create = async (
  input: z.infer<typeof createMessageSchema>,
  uid: number
) => {
  const { type, content, recipientId, link } = input

  const message = await createMessage({
    type,
    content,
    sender_id: uid,
    recipient_id: recipientId,
    link
  })

  return message
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createMessageSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await create(input, payload.uid)
  return NextResponse.json(response)
}
