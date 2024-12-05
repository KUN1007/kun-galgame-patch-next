export interface PatchComment {
  id: number
  user: KunUser
  content: string
  patchName: string
  patchId: number
  like: number
  created: Date | string
}
