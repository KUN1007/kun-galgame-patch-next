import { kunMoyuMoe } from '~/config/moyu-moe'
import { SUPPORTED_TYPE_MAP } from '~/constants/resource'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '搜索 Galgame 补丁',
  description: `您可以在此处搜索所有的 Galgame 补丁资源, 包括 ${Object.values(SUPPORTED_TYPE_MAP)} 等等`,
  openGraph: {
    title: '搜索 Galgame 补丁',
    description: `您可以在此处搜索所有的 Galgame 补丁资源, 包括 ${Object.values(SUPPORTED_TYPE_MAP)} 等等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '搜索 Galgame 补丁',
    description: `您可以在此处搜索所有的 Galgame 补丁资源, 包括 ${Object.values(SUPPORTED_TYPE_MAP)} 等等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/search`
  }
}
