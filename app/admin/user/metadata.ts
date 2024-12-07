import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: `用户管理 - ${kunMoyuMoe.titleShort}`,
  description: `管理 ${kunMoyuMoe.titleShort} 的所有用户, 更改用户权限, 设置用户为管理员, 设置用户为创作者, 封禁用户 等`,
  openGraph: {
    title: `用户管理 - ${kunMoyuMoe.titleShort}`,
    description: `管理 ${kunMoyuMoe.titleShort} 的所有用户, 更改用户权限, 设置用户为管理员, 设置用户为创作者, 封禁用户 等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: `用户管理 - ${kunMoyuMoe.titleShort}`,
    description: `管理 ${kunMoyuMoe.titleShort} 的所有用户, 更改用户权限, 设置用户为管理员, 设置用户为创作者, 封禁用户 等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin/user`
  }
}
