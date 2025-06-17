import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { getChatRoomMessageSchema } from '~/validations/chat'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { ChatMessageSelectField } from '~/constants/api/select'
import type { ChatMessage } from '~/types/api/chat'

export const getChatRoomMessage = async (
  input: z.infer<typeof getChatRoomMessageSchema>,
  uid: number
) => {
  const { link, cursor, limit } = input
  let roomId: number | undefined

  const isPrivateChatLink = /^\d+-\d+$/.test(link)

  if (isPrivateChatLink) {
    const [id1, id2] = input.link.split('-').map(Number)
    if (uid !== id1 && uid !== id2) {
      return '您没有权限访问此私聊'
    }

    const existingRoom = await prisma.chat_room.findFirst({ where: { link } })
    if (existingRoom) {
      roomId = existingRoom.id
    } else {
      const newRoom = await prisma.chat_room.create({
        data: {
          link,
          type: 'PRIVATE',
          name: '',
          avatar: '',
          member: {
            create: [
              { user_id: id1, role: 'MEMBER' },
              { user_id: id2, role: 'MEMBER' }
            ]
          }
        }
      })
      roomId = newRoom.id
    }
  } else {
    const member = await prisma.chat_member.findFirst({
      where: { user_id: uid, chat_room: { link } }
    })
    if (!member) {
      return '无权访问, 您未加入这个群组'
    }
    roomId = member.chat_room_id
  }

  if (!roomId) {
    return '未找到这个聊天'
  }

  const data = await prisma.chat_message.findMany({
    where: { chat_room_id: roomId },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { created: 'desc' },
    include: ChatMessageSelectField
  })
  const messages: ChatMessage[] = data
    .map((msg) => ({
      ...msg,
      seenBy: msg.seen_by,
      quoteMessage: msg.reply_to
        ? {
            senderName: msg.reply_to.sender.name,
            content: msg.reply_to.content
          }
        : undefined
    }))
    .reverse()

  let nextCursor = null
  if (messages.length === limit) {
    nextCursor = messages[limit - 1].id
  }

  return { messages, nextCursor }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getChatRoomMessageSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await getChatRoomMessage(input, payload.uid)
  return NextResponse.json(response)
}
