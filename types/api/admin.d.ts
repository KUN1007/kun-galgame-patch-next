export interface AdminUser {
  id: number
  name: string
  avatar: string
  role: number
  status: number
  created: Date | string
  _count: {
    patch: number
    patch_resource: number
  }
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
