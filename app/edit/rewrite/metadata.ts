import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '更改补丁 | 更改 Galgame',
  description:
    '更改已经发布的 Galgame 信息, 介绍, 标签, 会社, 别名等, 然后提出 pull request',
  openGraph: {
    title: '更改补丁 | 更改 Galgame',
    description:
      '更改已经发布的 Galgame 信息, 介绍, 标签, 会社, 别名等, 然后提出 pull request',
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '更改补丁 | 更改 Galgame',
    description:
      '更改已经发布的 Galgame 信息, 介绍, 标签, 会社, 别名等, 然后提出 pull request'
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/edit/rewrite`
  }
}
