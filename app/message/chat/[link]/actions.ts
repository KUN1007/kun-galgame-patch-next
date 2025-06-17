import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { getChatRoomMessage } from '~/app/api/chat-room/message/route'
import { MAX_CHAT_MESSAGE_PER_REQUEST } from '~/constants/chat'

export const kunGetActions = async (link: string) => {
  const payload = await verifyHeaderCookie()
  if (!payload) {
    return '用户登陆失效'
  }

  const roomDetails = await getChatRoomMessage(
    { link, cursor: 0, limit: MAX_CHAT_MESSAGE_PER_REQUEST },
    payload.uid
  )
  if (typeof roomDetails === 'string') {
    return roomDetails
  }

  const chatroom = await prisma.chat_room.findUnique({
    where: { link },
    include: {
      member: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }
    }
  })
  if (!chatroom) {
    return '未找到该聊天'
  }

  if (chatroom.type === 'PRIVATE') {
    const otherMember = chatroom.member.find(
      (member) => member.user_id !== payload.uid
    )

    if (otherMember && otherMember.user) {
      chatroom.name = otherMember.user.name
      chatroom.avatar = otherMember.user.avatar
    }
  }

  return {
    chatroom,
    initialMessages: roomDetails.messages,
    currentUserId: payload.uid
  }
}
