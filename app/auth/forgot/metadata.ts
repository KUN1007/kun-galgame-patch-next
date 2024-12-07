import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '忘记密码 | 找回密码',
  description: `忘记了您的 ${kunMoyuMoe.titleShort} 账号, 您可以通过邮箱, 用户找回密码和账号`,
  openGraph: {
    title: '忘记密码 | 找回密码',
    description: `忘记了您的 ${kunMoyuMoe.titleShort} 账号, 您可以通过邮箱, 用户找回密码和账号`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '忘记密码 | 找回密码',
    description: `忘记了您的 ${kunMoyuMoe.titleShort} 账号, 您可以通过邮箱, 用户找回密码和账号`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/auth/forgot`
  }
}
