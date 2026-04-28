// Matches apps/api/internal/patch/model/model.go PatchResource.
interface PatchResource {
  id: number
  storage: string
  name: string
  model_name: string
  size: string
  type: string[]
  language: string[]
  platform: string[]
  note: string
  blake3?: string
  s3_key?: string
  content?: string
  code?: string
  password?: string
  like_count: number
  is_liked?: boolean
  status?: number
  download: number
  user_id?: number
  patch_id: number
  created: string
  update_time?: Date | string
  user: KunUser
}

interface PatchResourceHtml extends PatchResource {
  note_html: string
}

interface HomeResource extends PatchResource {}

// D11 + D12: the resource detail page receives a lightweight owning-patch card
// that is really just the enricher GalgameCard shape. We re-use GalgameCard
// rather than redefine it so the fields stay in lockstep with the backend.
interface PatchResourceDetail {
  resource: PatchResourceHtml
  patch: GalgameCard | null
  recommendations: PatchResource[]
}
