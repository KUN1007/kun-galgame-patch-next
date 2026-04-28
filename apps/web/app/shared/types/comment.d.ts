// PatchComment is used for home/global comment summaries (backend enricher-free rows).
interface PatchComment {
  id: number
  user: KunUser
  content: string
  patch_name?: KunLanguage
  patch_id: number
  like_count: number
  created: Date | string
}

// PatchPageComment is a top-level or reply comment returned from
// GET /api/v1/patch/:id/comment. is_liked is filled per-request from the
// current user's like relation (false for anonymous callers).
interface PatchPageComment {
  id: number
  content: string
  is_liked: boolean
  like_count: number
  parent_id: number | null
  user_id: number
  patch_id: number
  created: string
  updated: string
  reply: PatchPageComment[]
  user: KunUser
  quoted_content?: string | null
  quoted_username?: string | null
}

interface HomeComment extends PatchComment {}
