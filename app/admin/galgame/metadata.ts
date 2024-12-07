import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: `Galgame 管理 - ${kunMoyuMoe.titleShort}`,
  description: `管理 ${kunMoyuMoe.titleShort} 所有的 Galgame, 包括创建新 Galgame, 删除 Galgame, 封禁 Galgame, 查询 Galgame, 更改 Galgame 介绍, 标签, 会社 等等`,
  openGraph: {
    title: `Galgame 管理 - ${kunMoyuMoe.titleShort}`,
    description: `管理 ${kunMoyuMoe.titleShort} 所有的 Galgame, 包括创建新 Galgame, 删除 Galgame, 封禁 Galgame, 查询 Galgame, 更改 Galgame 介绍, 标签, 会社 等等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: `Galgame 管理 - ${kunMoyuMoe.titleShort}`,
    description: `管理 ${kunMoyuMoe.titleShort} 所有的 Galgame, 包括创建新 Galgame, 删除 Galgame, 封禁 Galgame, 查询 Galgame, 更改 Galgame 介绍, 标签, 会社 等等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin`
  }
}
