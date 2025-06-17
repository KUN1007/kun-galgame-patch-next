import type {
  chat_message,
  chat_room,
  chat_member,
  user,
  chat_message_reaction,
  chat_message_seen
} from '@prisma/client'

export type ChatRoom = chat_room

export interface ChatMessageReaction extends chat_message_reaction {
  user: KunUser
}

export interface QuoteMessage {
  senderName: string
  content: string
}

export interface GetChatroomResponse extends ChatRoom {
  message: (chat_message & { sender: KunUser })[]
  member: (chat_member & { user: KunUser })[]
}

export interface ChatMessage extends chat_message {
  sender: KunUser
  seenBy: chat_message_seen[]
  reaction: ChatMessageReaction[]
  quoteMessage?: QuoteMessage
}

export interface JoinChatRoomResponse extends chat_room {
  member: chat_member[]
}

export type ChatRoomWithLatestMessage = chat_room & {
  message: (chat_message & { sender: KunUser })[]
}

export interface ChatMessagesApiResponse {
  messages: ChatMessageWithSender[]
  nextCursor: number | null
}
