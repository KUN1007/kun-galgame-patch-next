import { Tag } from './tag'
import { Company } from './company'

export interface Patch {
  id: number
  vndbId: string | null
  name: string
  banner: string
  introduction: string
  status: number
  view: number
  download: number
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
  updated: string
  _count: {
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
}

export interface PatchIntroduction {
  vndbId: string | null
  introduction: string
  released: string
  alias: string[]
  tag: Tag[]
  company: Company[]
  created: string
  updated: string
}

export interface PatchUpdate {
  name: string
  alias: string[]
  introduction: string
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
  likeCount: number
  isLike: boolean
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
  isLike: boolean
  likeCount: number
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
