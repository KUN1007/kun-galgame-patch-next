export interface Message {
  id: number
  type: string
  content: string
  status: number
  patch_id: number
  patch_resource_id: number
  comment_id: number
  created: string | Date
  sender: KunUser | null
}
