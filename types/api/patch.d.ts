export type Language = 'OTHER' | 'CHINESE' | 'ENGLISH' | 'JAPANESE'

export interface Patch {
  id: number
  name: string
  vndb_id: string
  banner: string
  introduction: string
  status: number
  view: number
  sell_time: number
  type: string[]
  alias: string[]
  language: Language
  created: Date
  updated: Date
  user: {
    id: number
    name: string
    avatar: string
  }
  _count?: {
    like_by: number
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
}
