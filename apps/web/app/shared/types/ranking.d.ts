interface RankingUser {
  id: number
  name: string
  avatar: string
  moemoepoint: number
  patchCount: number
  resourceCount: number
  commentCount: number
}

interface RankingPatch {
  id: number
  name: KunLanguage
  banner: string
  view: number
  download: number
  _count?: {
    favorite_by?: number
    resource?: number
    comment?: number
  }
}
