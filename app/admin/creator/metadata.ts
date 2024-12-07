import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: `创作者管理 - ${kunMoyuMoe.titleShort}`,
  description: `管理 ${kunMoyuMoe.titleShort} 所有的创作者, 同意创作者请求, 拒绝创作者请求, 查看创作者列表 等等`,
  openGraph: {
    title: `创作者管理 - ${kunMoyuMoe.titleShort}`,
    description: `管理 ${kunMoyuMoe.titleShort} 所有的创作者, 同意创作者请求, 拒绝创作者请求, 查看创作者列表 等等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: `创作者管理 - ${kunMoyuMoe.titleShort}`,
    description: `管理 ${kunMoyuMoe.titleShort} 所有的创作者, 同意创作者请求, 拒绝创作者请求, 查看创作者列表 等等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin`
  }
}
