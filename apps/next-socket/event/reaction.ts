import { Server, Socket } from 'socket.io'
import { prisma } from '~/prisma'
import { messageReactionSchema } from '~/validations/chat'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import type { ChatMessageReaction } from '~/types/api/chat'

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
  } else {
    await prisma.chat_message_reaction.create({
      data: { chat_message_id: messageId, user_id: user.id, emoji }
    })
  }

  const reactionArray: ChatMessageReaction[] =
    await prisma.chat_message_reaction.findMany({
      where: { chat_message_id: messageId },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    })

  io.to(`room:${message.chat_room_id}`).emit(KUN_CHAT_EVENT.REACTION_UPDATED, {
    messageId,
    reaction: reactionArray
  })
}
