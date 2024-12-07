import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: `管理日志 - ${kunMoyuMoe.titleShort}`,
  description: `${kunMoyuMoe.titleShort} 管理系统所有的操作记录, 更改用户权限, 封禁用户, 删除 Galgame 补丁资源, 删除评论, 更改 Galgame 介绍, 标签, 别名等`,
  openGraph: {
    title: `管理日志 - ${kunMoyuMoe.titleShort}`,
    description: `${kunMoyuMoe.titleShort} 管理系统所有的操作记录, 更改用户权限, 封禁用户, 删除 Galgame 补丁资源, 删除评论, 更改 Galgame 介绍, 标签, 别名等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: `管理日志 - ${kunMoyuMoe.titleShort}`,
    description: `${kunMoyuMoe.titleShort} 管理系统所有的操作记录, 更改用户权限, 封禁用户, 删除 Galgame 补丁资源, 删除评论, 更改 Galgame 介绍, 标签, 别名等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin`
  }
}
