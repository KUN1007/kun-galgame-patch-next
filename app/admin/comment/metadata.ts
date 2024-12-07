import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '评论管理',
  description: `管理 ${kunMoyuMoe.titleShort} 所有的评论, 查询所有评论, 删除评论, 更改评论内容, 查看评论列表 等等`,
  openGraph: {
    title: '评论管理',
    description: `管理 ${kunMoyuMoe.titleShort} 所有的评论, 查询所有评论, 删除评论, 更改评论内容, 查看评论列表 等等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '评论管理',
    description: `管理 ${kunMoyuMoe.titleShort} 所有的评论, 查询所有评论, 删除评论, 更改评论内容, 查看评论列表 等等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin`
  }
}
