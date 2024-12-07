import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'

export const generateKunMetadataTemplate = (
  user: UserInfo,
  galgames: GalgameCard[]
): Metadata => {
  const galgameList = galgames.map((gal) => gal.name)
  const resourceString = galgameList.toString().slice(0, 170)

  return {
    title: `${user.name} 发布的 Galgame - ${kunMoyuMoe.titleShort}`,
    description: galgameList.length
      ? `用户已经发布了 ${resourceString}`
      : `用户 ${user.name} 还没有发布过 Galgame 哦`,
    openGraph: {
      title: `${user.name} 发布的 Galgame`,
      description: galgameList.length
        ? `用户已经发布了 ${resourceString}`
        : `用户 ${user.name} 还没有发布过 Galgame 哦`,
      images: [{ url: user.avatar }],
      type: 'profile',
      username: user.name
    },
    twitter: {
      card: 'summary',
      title: `${user.name} 发布的 Galgame`,
      description: galgameList.length
        ? `用户已经发布了 ${resourceString}`
        : `用户 ${user.name} 还没有发布过 Galgame 哦`,
      images: [user.avatar]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/user/${user.id}/galgame`
    }
  }
}
