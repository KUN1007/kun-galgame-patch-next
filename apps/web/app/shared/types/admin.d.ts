interface SumData {
  userCount: number
  galgameCount: number
  patchResourceCount: number
  patchCommentCount: number
}

interface OverviewData {
  newUser: number
  newActiveUser: number
  newGalgame: number
  newPatchResource: number
  newComment: number
}

interface AdminUser {
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

interface AdminCreator {
  id: number
  content: string
  status: number
  sender: KunUser | null
  patchResourceCount: number
  created: Date | string
}

interface AdminGalgame {
  id: number
  name: KunLanguage
  banner: string
  user: KunUser
  created: Date | string
}

interface AdminResourceItem {
  id: number
  name: string
  modelName: string
  size: string
  type: string[]
  language: string[]
  platform: string[]
  note: string
  patchId: number
  patchName: KunLanguage
  download: number
  likeCount: number
  created: string
  user: KunUser
}

interface AdminLog {
  id: number
  type: string
  user: KunUser
  content: string
  created: Date | string
}
