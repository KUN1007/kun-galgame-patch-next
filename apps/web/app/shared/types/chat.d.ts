interface ChatRoomSummary {
  id: number
  link: string
  type: 'PRIVATE' | 'GROUP' | string
  name: string
  avatar: string
  memberCount?: number
  lastMessageTime?: string | Date | null
  lastMessage?: {
    content: string
    senderName: string
    status?: string
  } | null
}

interface ChatRoomMember {
  id: number
  user: KunUser
}

interface ChatRoomDetail {
  id: number
  link: string
  type: 'PRIVATE' | 'GROUP' | string
  name: string
  avatar: string
  member: ChatRoomMember[]
}

interface ChatMessageItem {
  id: number
  chatRoomId: number
  senderId: number
  content: string
  status: string
  created: string | Date
  updated?: string | Date
  sender: KunUser
}
