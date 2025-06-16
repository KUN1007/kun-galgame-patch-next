import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { joinChatGroupSchema } from '~/validations/chat'
import type { JoinChatRoomResponse } from '~/types/api/chat'

export const joinChatroom = async (link: string, uid: number) => {
  const room: JoinChatRoomResponse | null = await prisma.chat_room.findFirst({
    where: { link },
    include: { member: true }
  })

  if (!room) {
    return '群组不存在'
  }
  if (room.type !== 'GROUP') {
    return '无法加入非群组聊天'
  }
  if (room.member.some((m) => m.user_id === uid)) {
    return '您已经是该群组成员'
  }

  await prisma.chat_member.create({
    data: {
      chat_room_id: room.id,
      user_id: uid,
      role: 'MEMBER'
    }
  })

  return room
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, joinChatGroupSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await joinChatroom(input.link, payload.uid)
  return NextResponse.json(response)
}
