import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '用户信息设置',
  description:
    '您可以在此处任何更改您的个人信息, 头像, 签名, 用户名, 更改密码, 更改邮箱',
  openGraph: {
    title: '用户信息设置',
    description:
      '您可以在此处任何更改您的个人信息, 头像, 签名, 用户名, 更改密码, 更改邮箱',
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '用户信息设置',
    description:
      '您可以在此处任何更改您的个人信息, 头像, 签名, 用户名, 更改密码, 更改邮箱'
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/settings/user`
  }
}
