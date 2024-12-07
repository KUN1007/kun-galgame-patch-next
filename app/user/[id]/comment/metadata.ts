import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'
import type { UserComment } from '~/types/api/user'

export const generateKunMetadataTemplate = (
  user: UserInfo,
  comments: UserComment[]
): Metadata => {
  const commentList = comments.map((com) => com.content)

  return {
    title: `${user.name} 发布的评论 - ${kunMoyuMoe.titleShort}`,
    description: commentList.length
      ? `${user.name} 最近在 ${comments[0].patchName} 发布了 ${commentList[0]}, 查看 ${user.name} 发布的 ${commentList.length} 条评论`
      : `用户 ${user.name} 最近没有发布评论`,
    openGraph: {
      title: `${user.name} 发起的 pull request`,
      description: commentList.length
        ? `${user.name} 最近在 ${comments[0].patchName} 发布了 ${commentList[0]}, 查看 ${user.name} 发布的 ${commentList.length} 条评论`
        : `用户 ${user.name} 最近没有发布评论`,
      images: [{ url: user.avatar }],
      type: 'profile',
      username: user.name
    },
    twitter: {
      card: 'summary',
      title: `${user.name} 发起的 pull request`,
      description: commentList.length
        ? `${user.name} 最近在 ${comments[0].patchName} 发布了 ${commentList[0]}, 查看 ${user.name} 发布的 ${commentList.length} 条评论`
        : `用户 ${user.name} 最近没有发布评论`,
      images: [user.avatar]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/user/${user.id}/comment`
    }
  }
}
