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
