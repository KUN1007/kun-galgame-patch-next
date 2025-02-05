import { KunCarousel } from './carousel/KunCarousel'
import { getKunPosts } from './carousel/mdx'

export const HomeHero = () => {
  const posts = getKunPosts()

  return <KunCarousel posts={posts} />
}
