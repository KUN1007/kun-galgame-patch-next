import { Server, Socket } from 'socket.io'
import { prisma } from '~/prisma'
import {
  sendMessageSchema,
  deleteMessageSchema,
  editMessageSchema
} from '~/validations/chat'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import { ChatMessageSelectField } from '~/constants/api/select'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import type { ChatMessage } from '~/types/api/chat'

export const handleSendMessage = async (
  io: Server,
  socket: Socket,
  data: unknown
) => {
  const result = sendMessageSchema.safeParse(data)
  if (!result.success) return

  const { roomId, content, fileUrl, replyToId } = result.data
  const user = socket.data.user

  const messageData = await prisma.chat_message.create({
    data: {
      content,
      file_url: fileUrl,
      chat_room_id: roomId,
      sender_id: user.id,
      reply_to_id: replyToId
    },
    include: ChatMessageSelectField
  })

  const message: ChatMessage = {
    ...messageData,
    content: await markdownToHtml(messageData.content),
    contentMarkdown: messageData.content,
    seenBy: messageData.seen_by,
    quoteMessage: messageData.reply_to
      ? {
          senderName: messageData.reply_to.sender.name,
          content: await markdownToHtml(messageData.reply_to.content)
        }
      : undefined
  }

  io.to(`room:${roomId}`).emit(KUN_CHAT_EVENT.RECEIVE_MESSAGE, message)
  await prisma.chat_room.update({
    where: { id: roomId },
    data: { last_message_time: new Date() }
  })
}

export const handleDeleteMessage = async (
  io: Server,
  socket: Socket,
  data: unknown
) => {
  const result = deleteMessageSchema.safeParse(data)
  if (!result.success) return

  const { messageId } = result.data
  const user = socket.data.user

  const message = await prisma.chat_message.findFirst({
    where: { id: messageId },
    include: {
      chat_room: { include: { member: { where: { user_id: user.id } } } }
    }
  })

  if (!message || message.chat_room.member.length === 0) {
    return
  }

  const member = message.chat_room.member[0]
  if (message.sender_id !== user.id && member.role === 'MEMBER') {
    return
  }

  await prisma.chat_message.update({
    where: { id: messageId },
    data: {
      status: 'DELETED',
      content: '',
      file_url: '',
      deleted_at: new Date(),
      deleted_by_id: user.id
    }
  })

  io.to(`room:${message.chat_room_id}`).emit(KUN_CHAT_EVENT.DELETE_MESSAGE, {
    messageId,
    roomId: message.chat_room_id
  })
}

export const handleEditMessage = async (
  io: Server,
  socket: Socket,
  data: unknown
) => {
  const result = editMessageSchema.safeParse(data)
  if (!result.success) {
    return
  }

  const { messageId, newContent } = result.data
  const user = socket.data.user

  const message = await prisma.chat_message.findFirst({
    where: { id: messageId, sender_id: user.id }
  })
  if (!message) {
    return
  }

  await prisma.chat_message.update({
    where: { id: messageId },
    data: { content: newContent, status: 'EDITED' }
  })

  // TODO: log the edit history
  await prisma.chat_message_edit_history.create({
    data: { chat_message_id: messageId, previous_content: message.content! }
  })

  // io.to(`room:${message.chat_room_id}`).emit(KUN_CHAT_EVENT.EDIT_MESSAGE, {
  //   messageId,
  //   roomId: message.chat_room_id,
  //   newContent
  // })
}
