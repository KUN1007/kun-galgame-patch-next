import type { PatchResourceHtml } from '~/types/api/patch'

export interface PatchResource {
  id: number
  storage: string
  name: string
  modelName: string
  size: string
  type: string[]
  language: string[]
  platform: string[]
  note: string
  likeCount: number
  download: number
  patchId: number
  patchName: KunLanguage
  created: string
  user: KunUser & {
    patchCount: number
  }
}

export interface ResourcePatchSummary {
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

export interface PatchResourceDetail {
  resource: PatchResourceHtml
  patch: ResourcePatchSummary
  recommendations: PatchResource[]
}
