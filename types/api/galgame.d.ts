interface GalgameCard {
  id: number
  name: string
  banner: string
  view: number
  download: number
  type: string[]
  language: string[]
  platform: string[]
  created: Date | string
  _count: {
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
}
