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
  language: string[]
  created: string
  updated: string
  user: {
    id: number
    name: string
    avatar: string
  }
  _count: {
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
  status: number
  userId: number
  patchId: number
  created: string
  updated: string
  code: string
  user: KunUser & {
    patchCount: number
  }
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
  quotedContent?: string | null
  quotedUsername?: string | null
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
