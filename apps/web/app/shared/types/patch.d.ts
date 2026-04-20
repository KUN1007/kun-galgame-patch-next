interface GalgameCard {
  id: number
  name: KunLanguage
  vndbId: string | null
  bid: number | null
  banner: string
  view: number
  download: number
  type: string[]
  language: string[]
  engine: string[]
  platform: string[]
  content_limit: KunContentLimit
  status: number
  created: Date | string
  resourceUpdateTime: Date | string
  _count: {
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
}

interface PatchCover {
  url: string
  image_id: string
  width: number
  height: number
  thumbnail_url: string
  thumb_width: number
  thumb_height: number
}

interface PatchScreenshot {
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

interface PatchDetailTag {
  id: number
  name: KunLanguage
  category: string
  spoiler_level: number
  provider: string
  count: number
}

interface PatchDetailCompany {
  id: number
  name: string
  logo: string
  count: number
}

interface PatchDetailAlias {
  id: number
  name: string
}

interface PatchRelease {
  id: number
  rid: string
  title: string
  released: string
  platforms: string[]
  languages: string[]
  minage: number
}

interface PatchHeader {
  id: number
  vndbId: string | null
  name: KunLanguage
  banner: string
  introductionMarkdown: KunLanguage
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
  created: string
  updated: string
  released: string
  _count: {
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
}

interface PatchDetail {
  id: number
  bid: number | null
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
  vndbId: string
  introduction: KunLanguage
  alias: PatchDetailAlias[]
  screenshot: PatchScreenshot[]
  tag: PatchDetailTag[]
  company: PatchDetailCompany[]
  release: PatchRelease[]
  char: PatchCharacter[]
  person: PatchPerson[]
  created: string
  updated: string
}
