export interface AdminStats {
  title: string
  value: string
  change: number
}

export interface AdminUser {
  id: number
  name: string
  bio: string
  avatar: string
  role: number
  status: number
  dailyImageCount: number
  created: Date | string
  _count: {
    patch: number
    patch_resource: number
  }
}

export interface AdminCreator {
  id: number
  content: string
  status: number
  sender: KunUser | null
  patchResourceCount: number
  created: Date | string
}

export interface AdminGalgame {
  id: number
  name: string
  banner: string
  user: KunUser
  created: Date | string
}

export interface AdminResource {
  id: number
  patchId: number
  patchName: string
  storage: string
  user: KunUser
  size: string
  created: Date | string
}

export interface AdminComment {
  id: number
  user: KunUser
  content: string
  patchName: string
  patchId: number
  like: number
  created: Date | string
}
