import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: 'Galgame 新作时间表',
  description: `本月发售的最新 Galgame 列表, Galgame 新作, Galgame 时间表, 最新 Galgame 新作分类, Galgame 新作资源下载, Galgame 新作大全`,
  openGraph: {
    title: 'Galgame 新作时间表',
    description: `本月发售的最新 Galgame 列表, Galgame 新作, Galgame 时间表, 最新 Galgame 新作分类, Galgame 新作资源下载, Galgame 新作大全`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galgame 新作时间表',
    description: `本月发售的最新 Galgame 列表, Galgame 新作, Galgame 时间表, 最新 Galgame 新作分类, Galgame 新作资源下载, Galgame 新作大全`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/release`
  }
}
