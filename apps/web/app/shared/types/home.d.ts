interface HomeResponse {
  galgames: GalgameCard[]
  resources: HomeResource[]
  comments: HomeComment[]
}

interface HomeCarouselMetadata {
  title: string
  banner: string
  description: string
  date: string
  authorName: string
  authorAvatar: string
  pin: boolean
  directory: string
  link: string
}
