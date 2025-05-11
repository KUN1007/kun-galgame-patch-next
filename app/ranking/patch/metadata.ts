import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: 'Galgame 补丁排行',
  description: `所有的 Galgame 以及 Galgame 补丁资源排行, 按照 浏览数, 下载数, 点赞数 筛选以获得最优质, 最热门, 最好的 Galgame 补丁资源`,
  openGraph: {
    title: 'Galgame 补丁排行',
    description: `所有的 Galgame 以及 Galgame 补丁资源排行, 按照 浏览数, 下载数, 点赞数 筛选以获得最优质, 最热门, 最好的 Galgame 补丁资源`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galgame 补丁排行',
    description: `所有的 Galgame 以及 Galgame 补丁资源排行, 按照 浏览数, 下载数, 点赞数 筛选以获得最优质, 最热门, 最好的 Galgame 补丁资源`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/ranking/patch`
  }
}
