import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '管理系统',
  description: `为 ${kunMoyuMoe.titleShort} 定制的管理系统, 可以查看 网站概览 用户总数量, 补丁总数量, 今日评论数, 日活跃用户, 包括 Galgame 管理, 补丁资源管理, 用户管理, 创作者管理, 评论管理, 系统设置, 管理日志 等等`,
  openGraph: {
    title: '管理系统',
    description: `为 ${kunMoyuMoe.titleShort} 定制的管理系统, 可以查看 网站概览 用户总数量, 补丁总数量, 今日评论数, 日活跃用户, 包括 Galgame 管理, 补丁资源管理, 用户管理, 创作者管理, 评论管理, 系统设置, 管理日志 等等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '管理系统',
    description: `为 ${kunMoyuMoe.titleShort} 定制的管理系统, 可以查看 网站概览 用户总数量, 补丁总数量, 今日评论数, 日活跃用户, 包括 Galgame 管理, 补丁资源管理, 用户管理, 创作者管理, 评论管理, 系统设置, 管理日志 等等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin`
  }
}
