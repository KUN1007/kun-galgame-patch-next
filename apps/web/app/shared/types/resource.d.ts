interface PatchResource {
  id: number
  storage: string
  name: string
  modelName: string
  size: string
  type: string[]
  language: string[]
  platform: string[]
  note: string
  hash?: string
  content?: string
  code?: string
  password?: string
  likeCount: number
  isLike?: boolean
  status?: number
  download: number
  userId?: number
  patchId: number
  patchName: KunLanguage
  created: string
  updateTime?: Date | string
  user: KunUser & {
    patchCount: number
  }
}

interface PatchResourceHtml extends PatchResource {
  noteHtml: string
}

interface HomeResource extends PatchResource {}

interface ResourcePatchSummary {
  id: number
  name: KunLanguage
  banner: string
  view: number
  download: number
  type: string[]
  language: string[]
  platform: string[]
  content_limit: string
  released: string
  created: Date | string
  alias: string[]
  company: {
    id: number
    name: string
    logo: string
    count: number
  }[]
  _count: {
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
}

interface PatchResourceDetail {
  resource: PatchResourceHtml
  patch: ResourcePatchSummary
  recommendations: PatchResource[]
}
