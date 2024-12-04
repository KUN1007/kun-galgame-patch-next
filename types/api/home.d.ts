import { AdminResource } from './admin'
import { AdminComment } from './admin'

export interface HomeCarousel {
  id: number
  galgameTitle: string
  description: string
  type: string[]
  language: string[]
  platform: string[]
}

export interface HomeResource {
  id: number
  storage: string
  size: string
  type: string[]
  language: string[]
  platform: string[]
  note: string
  likeCount: number
  patchId: number
  patchName: string
  created: string
  user: KunUser
}

export type HomeComment = AdminComment
