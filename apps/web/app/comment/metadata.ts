import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: 'Galgame 评论',
  description: `最新发布的 Galgame 评论列表, 包括对下载的看法, 对 Galgame 的评分, 对 Galgame 的吐槽等等`,
  openGraph: {
    title: 'Galgame 评论',
    description: `最新发布的 Galgame 评论列表, 包括对下载的看法, 对 Galgame 的评分, 对 Galgame 的吐槽等等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galgame 评论',
    description: `最新发布的 Galgame 评论列表, 包括对下载的看法, 对 Galgame 的评分, 对 Galgame 的吐槽等等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/comment`
  }
}
