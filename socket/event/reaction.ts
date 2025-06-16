import { Server, Socket } from 'socket.io'
import { prisma } from '~/prisma'
import { messageReactionSchema } from '~/validations/chat'
import { KUN_CHAT_EVENT } from '~/constants/chat'

export const handleToggleReaction = async (
  io: Server,
  socket: Socket,
  data: unknown
) => {
  const result = messageReactionSchema.safeParse(data)
  if (!result.success) return

  const { messageId, emoji } = result.data
  const user = socket.data.user

  const existingReaction = await prisma.chat_message_reaction.findUnique({
    where: {
      user_id_chat_message_id_emoji: {
        user_id: user.id,
        chat_message_id: messageId,
        emoji
      }
    }
  })

  const message = await prisma.chat_message.findUnique({
    where: { id: messageId },
    select: { chat_room_id: true }
  })
  if (!message) return

  if (existingReaction) {
    await prisma.chat_message_reaction.delete({
      where: { id: existingReaction.id }
    })
    io.to(`room:${message.chat_room_id}`).emit(KUN_CHAT_EVENT.REMOVE_REACTION, {
      messageId,
      reactionId: existingReaction.id
    })
  } else {
    const newReaction = await prisma.chat_message_reaction.create({
      data: { chat_message_id: messageId, user_id: user.id, emoji },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    })
    io.to(`room:${message.chat_room_id}`).emit(KUN_CHAT_EVENT.ADD_REACTION, {
      messageId,
      reaction: newReaction
    })
  }
}
