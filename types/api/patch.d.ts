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

export interface PatchResourceLink {
  id: number
  type: string
  hash: string
  content: string
}

export interface PatchResource {
  id: number
  size: string
  type: string[]
  link: PatchResourceLink[]
  language: string[]
  note: string
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
