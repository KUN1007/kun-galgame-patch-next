import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'

export const generateKunMetadataTemplate = (
  user: UserInfo,
  favorites: GalgameCard[]
): Metadata => {
  const favoriteList = favorites.map((fav) => fav.name)
  const favoriteString = favoriteList.toString().slice(0, 170)

  return {
    title: `${user.name} 收藏过的 Galgame 游戏 - ${kunMoyuMoe.titleShort}`,
    description: favoriteList.length
      ? `${user.name} 十分喜欢 ${favoriteString} 等 ${favoriteList.length} 个 Galgame 游戏!`
      : `用户 ${user.name} 没有收藏过 Galgame 游戏`,
    openGraph: {
      title: `${user.name} 收藏过的 Galgame 游戏`,
      description: favoriteList.length
        ? `${user.name} 十分喜欢 ${favoriteString} 等 ${favoriteList.length} 个 Galgame 游戏!`
        : `用户 ${user.name} 没有收藏过 Galgame 游戏`,
      images: [{ url: user.avatar }],
      type: 'profile',
      username: user.name
    },
    twitter: {
      card: 'summary',
      title: `${user.name} 收藏过的 Galgame 游戏`,
      description: favoriteList.length
        ? `${user.name} 十分喜欢 ${favoriteString} 等 ${favoriteList.length} 个 Galgame 游戏!`
        : `用户 ${user.name} 没有收藏过 Galgame 游戏`,
      images: [user.avatar]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/user/${user.id}/favorite`
    }
  }
}
