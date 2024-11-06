export interface UserInfo {
  id: number
  name: string
  email: string
  avatar: string
  bio: string
  role: string
  status: number
  registerTime: string
  moemoepoint: number
  _count: {
    patch: number
    patch_comment: number
    patch_favorite: number
    patch_pull_request: number
  }
}
