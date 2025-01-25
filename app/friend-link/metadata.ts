import { kunMoyuMoe } from '~/config/moyu-moe'
import { kunFriends } from '~/config/friend'
import type { Metadata } from 'next'
import type { KunSiteImage } from '~/config/config'

const friendName = kunFriends.map((f) => f.name)

const friendIcons: KunSiteImage[] = kunFriends.map((f) => ({
  url: f.link,
  width: 64,
  height: 64,
  alt: f.label
}))

export const kunMetadata: Metadata = {
  title: '友情链接',
  description: `点击以进入 ${friendName}`,
  openGraph: {
    title: '友情链接',
    description: `点击以进入 ${friendName}`,
    type: 'website',
    images: friendIcons
  },
  twitter: {
    card: 'summary_large_image',
    title: '友情链接',
    description: `点击以进入 ${friendName}`,
    images: kunMoyuMoe.images
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/friend-link`
  }
}
