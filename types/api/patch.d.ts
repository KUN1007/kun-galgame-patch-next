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
  resourceUpdateTime: Date | string
  content_limit: string
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

export interface PatchDetail {
  id: number
  name: string
  name_en_us: string
  name_ja_jp: string
  name_zh_cn: string
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
  introduction_zh_cn: string
  introduction_ja_jp: string
  introduction_en_us: string
  vndbId: string
  cover: {
    url: string
    image_id: string
    width: number
    height: number
    thumbnail_url: string
    thumb_width: number
    thumb_height: number
  } | null
  screenshot: {
    id: number
    image_id: string
    url: string
    width: number
    height: number
    thumbnail_url: string
    thumb_width: number
    thumb_height: number
    order_no: number
  }[]
  tag: {
    id: number
    name: string
    name_en_us: string
    category: string
    spoiler_level: number
    provider: string
    count: number
  }[]
  company: {
    id: number
    name: string
    logo: string
    count: number
  }[]
  release: {
    id: number
    rid: string
    title: string
    released: string
    platforms: string[]
    languages: string[]
    minage: number
  }[]
  char: {
    id: number
    image: string
    gender: string
    role?: string
    roles: string[]
    name_zh_cn: string
    name_ja_jp: string
    name_en_us: string
    description_zh_cn: string
    description_ja_jp: string
    description_en_us: string
    infobox: string
  }[]
  person: {
    id: number
    image: string
    roles: string[]
    name_zh_cn: string
    name_ja_jp: string
    name_en_us: string
    description_zh_cn: string
    description_ja_jp: string
    description_en_us: string
  }[]
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
