import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '发布补丁 | 发布 Galgame',
  description:
    '您需要创建一个新 Galgame, 稍后在 Galgame 页面添加补丁资源, 如果已经有这个 Galgame 了, 直接在对应页面添加资源即可',
  openGraph: {
    title: '发布补丁 | 发布 Galgame',
    description:
      '您需要创建一个新 Galgame, 稍后在 Galgame 页面添加补丁资源, 如果已经有这个 Galgame 了, 直接在对应页面添加资源即可',
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '发布补丁 | 发布 Galgame',
    description:
      '您需要创建一个新 Galgame, 稍后在 Galgame 页面添加补丁资源, 如果已经有这个 Galgame 了, 直接在对应页面添加资源即可'
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/edit/create`
  }
}
