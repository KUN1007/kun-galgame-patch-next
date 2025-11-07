import type {
  chat_message,
  chat_room,
  chat_member,
  user,
  chat_message_reaction,
  chat_message_seen
} from '@prisma/client'

export interface ChatRoom extends chat_room {
  memberCount: number
}

export interface ChatMessageReaction extends chat_message_reaction {
  user: KunUser
}

export interface QuoteMessage {
  senderName: string
  content: string
}

export interface GetChatroomResponse extends chat_room {
  message: (chat_message & { sender: KunUser })[]
  member: (chat_member & { user: KunUser })[]
}

export interface ChatMessage extends chat_message {
  contentMarkdown: string
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
  messages: ChatMessage[]
  nextCursor: number | null
}
