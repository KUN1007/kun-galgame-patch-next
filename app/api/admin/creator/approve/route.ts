import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createMessage } from '~/app/api/utils/message'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { approveCreatorSchema } from '~/validations/admin'

export const approveCreator = async (
  input: z.infer<typeof approveCreatorSchema>
) => {
  const { messageId, uid } = input
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
      data: { status: { set: 2 } }
    })

    await prisma.user.update({
      where: { id: uid },
      data: { role: { set: 2 } }
    })

    await createMessage({
      type: 'apply',
      content: '恭喜! 您的创作者申请已经通过!',
      recipient_id: message.sender_id ?? undefined
    })

    return {}
  })
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, approveCreatorSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  const response = await approveCreator(input)
  return NextResponse.json(response)
}
