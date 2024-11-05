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
  created: string
  updated: string
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

interface PatchResource {
  id: number
  size: string
  type: string[]
  language: string[]
  note: string
  link: string[]
  password: string
  platform: string[]
  likedBy: KunUser[]
  time: number
  status: number
  userId: number
  patchId: number
  created: string
  updated: string
  code: string
  user: KunUser
}

interface PatchComment {
  id: number
  content: string
  likedBy: KunUser[]
  parentId: number | null
  userId: number
  patchId: number
  created: string
  updated: string
  user: KunUser
}

interface PatchHistory {
  id: number
  action: string
  type: string
  content: string
  userId: number
  patchId: number
  created: string
  updated: string
  user: KunUser
}
