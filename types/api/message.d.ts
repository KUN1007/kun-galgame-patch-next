export interface Message {
  id: number
  type: string
  content: string
  status: number
  link: string
  created: string | Date
  sender: KunUser | null
}
