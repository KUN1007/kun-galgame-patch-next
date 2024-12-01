import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createMessage } from '~/app/api/utils/message'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { declineCreatorSchema } from '~/validations/admin'

export const approveCreator = async (
  input: z.infer<typeof declineCreatorSchema>
) => {
  const { messageId, reason } = input
  const message = await prisma.user_message.findUnique({
    where: { id: messageId }
  })
  if (!message) {
    return '未找到该创作者请求'
  }

  return prisma.$transaction(async (prisma) => {
    await prisma.user_message.update({
      where: { id: messageId },
      // status: 0 - unread, 1 - read, 2 - approve, 3 - decline
      data: { status: { set: 3 } }
    })

    await createMessage({
      type: 'apply',
      content: `您的创作者申请被拒绝, 理由: ${reason}`,
      recipient_id: message.sender_id ?? undefined
    })

    return {}
  })
}

export const PUT = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, declineCreatorSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await approveCreator(input)
  return NextResponse.json(response)
}
