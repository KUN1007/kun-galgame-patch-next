import { Server, Socket } from 'socket.io'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import { userTypingMessageSchema } from '~/validations/chat'

export const handleUserTyping = (io: Server, socket: Socket, data: unknown) => {
  const result = userTypingMessageSchema.safeParse(data)
  if (!result.success) return

  const { roomId, isTyping } = result.data
  const user = socket.data.user

  // broadcast to all member except current user
  socket.broadcast.to(`room:${roomId}`).emit(KUN_CHAT_EVENT.USER_TYPING, {
    roomId,
    isTyping,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar
    }
  })
}
