import type {
  chat_message,
  chat_room,
  chat_member,
  user,
  chat_message_reaction,
  chat_message_seen
} from '@prisma/client'

// export type _ChatMessage = chat_message
// export type _ChatRoom = chat_room
// export type _ChatMember = chat_member
// export type _ChatMessageReaction = chat_message_reaction
// export type _ChatMessageSeen = chat_message_seen

export type ChatRoom = chat_room

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
  reaction: chat_message_reaction[]
  quoteMessage?: QuoteMessage
}

export interface JoinChatRoomResponse extends chat_room {
  member: chat_member[]
}

export type ChatRoomWithDetails = chat_room & {
  message: (chat_message & { sender: Pick<user, 'name'> })[]
  _other_user?: KunUser
}

export interface ChatRoomsApiResponse {
  rooms: ChatRoomWithDetails[]
}

export interface ChatMessagesApiResponse {
  messages: ChatMessageWithSender[]
  nextCursor: number | null
}
