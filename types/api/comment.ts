export interface PatchComment {
  id: number
  user: KunUser
  content: string
  patchName: KunLanguage
  patchId: number
  like: number
  created: Date | string
}
