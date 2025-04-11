import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '注册',
  description: `注册成为 ${kunMoyuMoe.titleShort} 网站用户, 无门槛下载任何 Galgame 补丁资源。希望明天对您来说又是美好的一天！`,
  keywords: [
    '注册',
    'Galgame 补丁 网站注册',
    '创建账户',
    '鲲 Galgame',
    '补丁下载',
    '免费注册'
  ],
  openGraph: {
    title: '注册 - 鲲 Galgame 补丁',
    description: `注册成为 ${kunMoyuMoe.titleShort} 网站用户, 无门槛下载任何 Galgame 补丁资源。希望明天对您来说又是美好的一天！`,
    url: `${kunMoyuMoe.domain.main}/register`,
    siteName: kunMoyuMoe.title,
    images: [
      {
        url: kunMoyuMoe.og.image,
        width: 1920,
        height: 1080,
        alt: '鲲 Galgame 补丁注册页面'
      }
    ],
    locale: 'zh_CN',
    type: 'website'
  },
  verification: {
    google: 'google-site-verification-code'
  },
  alternates: {
    canonical: 'https://www.kungal.com/register',
    languages: {
      'zh-Hans': `${kunMoyuMoe.domain.main}/register`
    }
  }
}
