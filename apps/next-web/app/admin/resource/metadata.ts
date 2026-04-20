import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: `补丁管理 - ${kunMoyuMoe.titleShort}`,
  description: `管理 ${kunMoyuMoe.titleShort} 所有的 Galgame 补丁下载资源, 创建资源, 更改资源类型, 语言, 平台, 删除 Galgame 补丁资源 等`,
  openGraph: {
    title: `补丁管理 - ${kunMoyuMoe.titleShort}`,
    description: `管理 ${kunMoyuMoe.titleShort} 所有的 Galgame 补丁下载资源, 创建资源, 更改资源类型, 语言, 平台, 删除 Galgame 补丁资源 等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: `补丁管理 - ${kunMoyuMoe.titleShort}`,
    description: `管理 ${kunMoyuMoe.titleShort} 所有的 Galgame 补丁下载资源, 创建资源, 更改资源类型, 语言, 平台, 删除 Galgame 补丁资源 等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin`
  }
}
