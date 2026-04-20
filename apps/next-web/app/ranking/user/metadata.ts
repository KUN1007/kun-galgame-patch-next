import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '用户排行榜',
  description: `所有发布 Galgame 以及 Galgame 资源的用户排行, 可以按照 萌萌点, Galgame, Galgame 补丁, 评论 进行排序, 查看用户的活跃和贡献排行, 查看最值得信赖的用户, 查看最强的 Galgame 补丁创作者`,
  openGraph: {
    title: '用户排行榜',
    description: `所有发布 Galgame 以及 Galgame 资源的用户排行, 可以按照 萌萌点, Galgame, Galgame 补丁, 评论 进行排序, 查看用户的活跃和贡献排行, 查看最值得信赖的用户, 查看最强的 Galgame 补丁创作者`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '用户排行榜',
    description: `所有发布 Galgame 以及 Galgame 资源的用户排行, 可以按照 萌萌点, Galgame, Galgame 补丁, 评论 进行排序, 查看用户的活跃和贡献排行, 查看最值得信赖的用户, 查看最强的 Galgame 补丁创作者`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/ranking/patch`
  }
}
