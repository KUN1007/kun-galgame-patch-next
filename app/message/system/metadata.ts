import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: '系统消息',
  description: `这是系统消息页面, 本页面展示了 ${kunMoyuMoe.titleShort} 系统发送给全体用户的消息`,
  openGraph: {
    title: '系统消息',
    description: `这是系统消息页面, 本页面展示了 ${kunMoyuMoe.titleShort} 系统发送给全体用户的消息`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: '系统消息',
    description: `这是系统消息页面, 本页面展示了 ${kunMoyuMoe.titleShort} 系统发送给全体用户的消息`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/message/system`
  }
}
