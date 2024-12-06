import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'

export const generateKunMetadataTemplate = (user: UserInfo): Metadata => {
  return {
    title: `${user.name} 的主页`,
    description:
      user.bio ||
      `查看用户 ${user.name} 的主页, Galgame 补丁资源, Galgame, 贡献历史, 评论, 收藏和关注`,
    openGraph: {
      title: `${user.name} 的主页`,
      description:
        user.bio ||
        `查看用户 ${user.name} 的主页, Galgame 补丁资源, Galgame, 贡献历史, 评论, 收藏和关注`,
      images: [{ url: user.avatar }],
      type: 'profile',
      username: user.name
    },
    twitter: {
      card: 'summary',
      title: `${user.name} 的主页`,
      description:
        user.bio ||
        `查看用户 ${user.name} 的主页, Galgame 补丁资源, Galgame, 贡献历史, 评论, 收藏和关注`,
      images: [user.avatar]
    }
  }
}
