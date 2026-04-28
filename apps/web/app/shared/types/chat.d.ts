// Chat message status is a string enum, not a numeric flag.
type ChatMessageStatus = 'SENT' | 'EDITED' | 'DELETED'

interface ChatRoomSummary {
  id: number
  link: string
  type: 'PRIVATE' | 'GROUP' | string
  name: string
  avatar: string
  last_message_time?: string | Date | null
  created: string | Date
  updated: string | Date
}

// GET /api/v1/chat/room/:link returns a RoomDetail, the inline ChatRoom plus `member`.
interface ChatRoomMember {
  id: number
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | string
  user_id: number
  chat_room_id: number
  created: string | Date
  updated: string | Date
  user: KunUser
}

interface ChatRoomDetail extends ChatRoomSummary {
  member: ChatRoomMember[]
}

interface ChatMessageItem {
  id: number
  chat_room_id: number
  sender_id: number
  content: string
  file_url: string
  status: ChatMessageStatus | string
  deleted_at: string | Date | null
  deleted_by_id: number | null
  reply_to_id: number | null
  created: string | Date
  updated: string | Date
  sender: KunUser
}
