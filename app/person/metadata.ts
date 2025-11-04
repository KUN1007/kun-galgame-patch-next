import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: 'Galgame 人物',
  description: '所有的 Galgame 人物索引与检索',
  openGraph: {
    title: 'Galgame 人物',
    description: '所有的 Galgame 人物索引与检索',
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galgame 人物',
    description: '所有的 Galgame 人物索引与检索'
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/person`
  }
}

