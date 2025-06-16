import { Server, Socket } from 'socket.io'
import { prisma } from '~/prisma'
import { seenMessageSchema } from '~/validations/chat'
import { KUN_CHAT_EVENT } from '~/constants/chat'

export const handleMessageSeen = async (
  io: Server,
  socket: Socket,
  data: unknown
) => {
  const result = seenMessageSchema.safeParse(data)
  if (!result.success) return

  const { messageId, roomId } = result.data
  const user = socket.data.user

  try {
    // create will fail if the unique constraint (user_id, message_id) is violated,
    // which is what we want. No need to check for existence first.
    await prisma.chat_message_seen.create({
      data: { chat_message_id: messageId, user_id: user.id }
    })

    // Broadcast to other members in the room that this user has seen the message
    socket.to(`room:${roomId}`).emit(KUN_CHAT_EVENT.MESSAGE_SEEN, {
      messageId,
      roomId,
      user: { id: user.id, name: user.name }
    })
  } catch (error) {
    // silent error
  }
}
