import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: 'Galgame 角色',
  description: '所有的 Galgame 角色索引与检索',
  openGraph: {
    title: 'Galgame 角色',
    description: '所有的 Galgame 角色索引与检索',
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galgame 角色',
    description: '所有的 Galgame 角色索引与检索'
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/character`
  }
}
