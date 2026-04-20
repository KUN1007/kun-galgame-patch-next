interface PatchComment {
  id: number
  user: KunUser
  content: string
  patchName: KunLanguage
  patchId: number
  like: number
  created: Date | string
}

interface PatchPageComment {
  id: number
  content: string
  isLike: boolean
  likeCount: number
  parentId: number | null
  userId: number
  patchId: number
  created: string
  updated: string
  reply: PatchPageComment[]
  user: KunUser
  quotedContent?: string | null
  quotedUsername?: string | null
}

interface HomeComment extends PatchComment {}
