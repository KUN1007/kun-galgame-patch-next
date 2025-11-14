import { Chip } from '@heroui/chip'
import { KunCarousel } from './carousel/KunCarousel'
import { getKunPosts } from './carousel/mdx'
import { Lollipop } from 'lucide-react'
import { kunMoyuMoe } from '~/config/moyu-moe'

export const HomeHero = () => {
  const posts = getKunPosts()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:block hidden select-none pointer-events-none relative">
        <Chip
          size="lg"
          className="absolute top-0 left-0"
          variant="flat"
          color="secondary"
        >
          <div className="flex items-center gap-2">
            <Lollipop className="h-5 w-5" />
            欢迎来到 {kunMoyuMoe.titleShort}
          </div>
        </Chip>
        <img className="rounded-2xl" src="/kungalgame-trans.webp" />
      </div>

      <KunCarousel posts={posts} />
    </div>
  )
}
