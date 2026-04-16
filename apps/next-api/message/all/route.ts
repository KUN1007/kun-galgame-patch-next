import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getMessageSchema } from '~/validations/message'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

export const getMessage = async (
  input: z.infer<typeof getMessageSchema>,
  uid: number
) => {
  const { type, page, limit } = input
  const offset = (page - 1) * limit

  const where = type ? { recipient_id: uid, type } : { recipient_id: uid }

  const [messages, total] = await Promise.all([
    prisma.user_message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { created: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.user_message.count({ where })
  ])

  return { messages, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getMessageSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await getMessage(input, payload.uid)
  return NextResponse.json(response)
}
