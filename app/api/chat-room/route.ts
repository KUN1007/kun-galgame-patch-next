import z from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { createChatRoomSchema } from '~/validations/chat'
import type { GetChatroomResponse } from '~/types/api/chat'

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await getChatroom(payload.uid)
  return NextResponse.json(response)
}

export const getChatroom = async (uid: number) => {
  const data: GetChatroomResponse[] = await prisma.chat_room.findMany({
    where: { member: { some: { user_id: uid } } },
    include: {
      message: {
        orderBy: { created: 'desc' },
        take: 1,
        include: { sender: { select: { id: true, name: true, avatar: true } } }
      },
      member: {
        where: { user_id: { not: uid } },
        include: { user: { select: { id: true, name: true, avatar: true } } }
      }
    },
    orderBy: { last_message_time: 'desc' }
  })

  const rooms = data.map((chatroom) => {
    if (chatroom.type === 'PRIVATE') {
      const otherMember = chatroom.member.find(
        (member) => member.user_id !== uid
      )

      if (otherMember && otherMember.user) {
        chatroom.name = otherMember.user.name
        chatroom.avatar = otherMember.user.avatar
      }
    }
    return chatroom
  })

  return rooms
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createChatRoomSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 4) {
    return NextResponse.json('目前创建群组仅超级管理员可用')
  }

  const response = await createChatRoom(input, payload.uid)
  return NextResponse.json(response)
}

export const createChatRoom = async (
  input: z.infer<typeof createChatRoomSchema>,
  uid: number
) => {
  const { name, link, avatar, memberIdArray } = input

  const allMember = [...new Set([uid, ...memberIdArray])]

  const newRoom = await prisma.chat_room.create({
    data: {
      name,
      type: 'GROUP',
      avatar,
      link,
      member: {
        create: allMember.map((id) => ({
          user_id: id,
          role: id === uid ? 'OWNER' : 'MEMBER'
        }))
      }
    }
  })

  // TODO: Notice that user was invited to a new group

  return NextResponse.json(newRoom)
}
