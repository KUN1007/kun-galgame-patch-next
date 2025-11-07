import { Tag } from './tag'
import { Company } from './company'

export interface PatchCover {
  url: string
  image_id: string
  width: number
  height: number
  thumbnail_url: string
  thumb_width: number
  thumb_height: number
}

export interface PatchScreenshot {
  id: number
  image_id: string
  url: string
  width: number
  height: number
  sexual: number
  violence: number
  thumbnail_url: string
  thumb_width: number
  thumb_height: number
  order_no: number
}

export interface PatchDetailTag {
  id: number
  name: KunLanguage
  category: string
  spoiler_level: number
  provider: string
  count: number
}

export interface PatchDetailCompany {
  id: number
  name: string
  logo: string
  count: number
}

export interface PatchRelease {
  id: number
  rid: string
  title: string
  released: string
  platforms: string[]
  languages: string[]
  minage: number
}

export interface PatchCharacter {
  id: number
  image: string
  gender: string
  role?: string
  roles: string[]
  name: KunLanguage
  description: KunLanguage
  infobox: string
}

export interface PatchPerson {
  id: number
  image: string
  roles: string[]
  name: KunLanguage
  description: KunLanguage
}

export interface PatchHeader {
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
  resourceUpdateTime: string | Date
  content_limit: string
  user: KunUser
  cover: PatchCover[]
  created: string | Date
  updated: string | Date
  _count: {
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
}

export interface PatchDetail {
  id: number
  bid: number
  name: KunLanguage
  banner: string
  content_limit: string
  view: number
  download: number
  released: string
  type: string[]
  language: string[]
  engine: string[]
  platform: string[]
  alias: string[]
  introduction: KunLanguage
  vndbId: string
  cover: PatchCover[]
  screenshot: PatchScreenshot[]
  tag: PatchDetailTag[]
  company: PatchDetailCompany[]
  release: PatchRelease[]
  char: PatchCharacter[]
  person: PatchPerson[]
  created: string
  updated: string
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
  contentLimit: string
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
  name: string
  modelName: string
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
  download: number
  userId: number
  patchId: number
  created: string
  updateTime: Date | string
  user: KunUser & {
    patchCount: number
  }
}

export interface PatchResourceHtml extends PatchResource {
  noteHtml: string
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
  reply: PatchComment[]
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

export interface PatchWalkthrough {
  id: number
  name: string
  markdown: string
  content: string
  created: string | Date
  updated: string | Date
  user: KunUser
  _count: {
    patch_walkthrough: number
  }
}
