import { Tag } from './tag'

export interface Patch {
  id: number
  name: string
  banner: string
  introduction: string
  status: number
  view: number
  alias: string[]
  type: string[]
  language: string[]
  platform: string[]
  isFavorite: boolean
  user: {
    id: number
    name: string
    avatar: string
  }
  created: string
  _count: {
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
}

export interface PatchIntroduction {
  vndbId: string
  introduction: string
  released: string
  alias: string[]
  tag: Tag[]
  created: string
  updated: string
}

export interface PatchPullRequest {
  id: number
  status: number
  index: number
  completeTime: string
  content: string
  note: string
  user: KunUser
  created: string
}

export interface PatchResource {
  id: number
  storage: string
  size: string
  type: string[]
  language: string[]
  note: string
  hash: string
  content: string
  code: string
  password: string
  platform: string[]
  likedBy: KunUser[]
  status: number
  userId: number
  patchId: number
  created: string
  user: KunUser & {
    patchCount: number
  }
}

export interface PatchComment {
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

export interface PatchHistory {
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
