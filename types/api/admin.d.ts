import type { PatchResourceHtml } from '~/types/api/patch'
import type { PatchComment } from '~/types/api/comment'

export type AdminStatsName =
  | 'user'
  | 'active'
  | 'patch'
  | 'patch_resource'
  | 'patch_comment'

export interface SumData {
  userCount: number
  galgameCount: number
  patchResourceCount: number
  patchCommentCount: number
}

export interface OverviewData {
  newUser: number
  newActiveUser: number
  newGalgame: number
  newPatchResource: number
  newComment: number
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

export interface AdminResource extends PatchResourceHtml {
  patchName: string
}

export type AdminComment = PatchComment

export interface AdminLog {
  id: number
  type: string
  user: KunUser
  content: string
  created: Date | string
}
