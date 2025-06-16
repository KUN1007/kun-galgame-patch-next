import { z } from 'zod'
import { MAX_CHAT_MESSAGE_PER_REQUEST } from '~/constants/chat'

const isValidChatGroup = (value: string) => {
  const userPrivateChatPattern = /^\d+-\d+$/
  return !userPrivateChatPattern.test(value)
}

const _chatGroupLinkSchema = z
  .string()
  .min(3, { message: '群组邀请链接最少 3 个字符' })
  .max(17, { message: '群组邀请链接最多 17 个字符' })
  .refine(isValidChatGroup, {
    message: '群组邀请链接不能是 xxx-xxx 的格式 (如 123-456)'
  })

export const joinChatGroupSchema = z.object({
  link: _chatGroupLinkSchema
})

export const getChatRoomMessageSchema = z.object({
  link: z
    .string()
    .min(3, { message: '群组邀请链接最少 3 个字符' })
    .max(17, { message: '群组邀请链接最多 17 个字符' }),
  cursor: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(MAX_CHAT_MESSAGE_PER_REQUEST)
})

export const getChatMessagesSchema = z.object({
  link: z.string(),
  cursor: z.string().optional()
})

export const createChatRoomSchema = z.object({
  name: z.string().min(1, '群聊名称不能为空').max(107),
  memberIdArray: z
    .array(z.number().min(1).max(9999999))
    .min(1, '群聊至少需要邀请一位成员')
})

export const sendMessageSchema = z.object({
  roomId: z.coerce.number().min(1).max(9999999),
  content: z.string().min(1).max(2000),
  fileUrl: z.string().url().optional(),
  replyToId: z.number().optional()
})

export const deleteMessageSchema = z.object({
  messageId: z.coerce.number().min(1).max(9999999)
})

export const editMessageSchema = z.object({
  messageId: z.coerce.number().min(1).max(9999999),
  newContent: z.string().min(1).max(2000)
})

export const messageReactionSchema = z.object({
  messageId: z.coerce.number().min(1).max(9999999),
  emoji: z.string().max(10)
})

export const seenMessageSchema = z.object({
  messageId: z.coerce.number().min(1).max(9999999),
  roomId: z.coerce.number().min(1).max(9999999)
})

export const userTypingMessageSchema = z.object({
  roomId: z.coerce.number().min(1).max(9999999),
  isTyping: z.boolean()
})
