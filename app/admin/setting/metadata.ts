import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '系统设置',
  description: `${kunMoyuMoe.titleShort} 的数据库备份, 鉴权设置, 认证设置, 网站整体风格设置, 启用维护模式 等`,
  openGraph: {
    title: '系统设置',
    description: `${kunMoyuMoe.titleShort} 的数据库备份, 鉴权设置, 认证设置, 网站整体风格设置, 启用维护模式 等`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '系统设置',
    description: `${kunMoyuMoe.titleShort} 的数据库备份, 鉴权设置, 认证设置, 网站整体风格设置, 启用维护模式 等`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin/setting`
  }
}
