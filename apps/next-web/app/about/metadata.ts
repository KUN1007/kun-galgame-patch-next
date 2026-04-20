import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '关于我们 | 网站博客',
  description: `${kunMoyuMoe.titleShort} 是一个非盈利的, 由社区驱动的, 完全开源免费的 Galgame 补丁资源下载网站。它由现代框架 Next.js 驱动, 为保证最好的性能, 恳请各位朋友提出宝贵的意见`,
  openGraph: {
    title: '关于我们 | 网站博客',
    description: `${kunMoyuMoe.titleShort} 是一个非盈利的, 由社区驱动的, 完全开源免费的 Galgame 补丁资源下载网站。它由现代框架 Next.js 驱动, 为保证最好的性能, 恳请各位朋友提出宝贵的意见`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '关于我们 | 网站博客',
    description: `${kunMoyuMoe.titleShort} 是一个非盈利的, 由社区驱动的, 完全开源免费的 Galgame 补丁资源下载网站。它由现代框架 Next.js 驱动, 为保证最好的性能, 恳请各位朋友提出宝贵的意见`
  }
}
