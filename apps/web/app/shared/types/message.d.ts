// GET /api/v1/message — see apps/api/internal/user/model UserMessage.
interface Message {
  id: number
  type: string
  content: string
  status: number
  link: string
  sender_id: number | null
  recipient_id: number | null
  created: string | Date
  updated: string | Date
  sender?: KunUser | null
}
