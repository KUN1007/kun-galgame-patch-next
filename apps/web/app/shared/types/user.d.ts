interface UserInfo {
  id: number
  requestUserUid: number
  name: string
  email: string
  avatar: string
  bio: string
  role: number
  status: number
  registerTime: string
  moemoepoint: number
  follower: number
  following: number
  isFollow: boolean
  _count: {
    patch: number
    patch_resource: number
    patch_comment: number
    patch_favorite: number
  }
}

interface UserResourceItem {
  id: number
  patchId: number
  patchName: KunLanguage
  patchBanner: string
  size: string
  type: string[]
  language: string[]
  platform: string[]
  created: string
}

interface UserContribute {
  id: number
  patchId: number
  patchName: KunLanguage
  created: string
}

interface UserComment {
  id: number
  content: string
  like: number
  userId: number
  patchId: number
  patchName: KunLanguage
  created: string
  quotedUserUid?: number | null
  quotedUsername?: string | null
}

interface UserFavoriteItem extends GalgameCard {}

interface UserGalgameItem extends GalgameCard {}
