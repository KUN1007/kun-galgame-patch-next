import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'
import type { UserContribute } from '~/types/api/user'

export const generateKunMetadataTemplate = (
  user: UserInfo,
  contributes: UserContribute[]
): Metadata => {
  const contributeList = contributes.map((cont) => cont.patchName)
  const contributeString = contributeList.toString().slice(0, 170)

  return {
    title: `${user.name} 发起的 pull request - ${kunMoyuMoe.titleShort}`,
    description: contributeList.length
      ? `${user.name} 为 ${contributeString} 等 ${contributeList.length} 个 Galgame 提出了 pull request`
      : `用户 ${user.name} 暂无 pull request`,
    openGraph: {
      title: `${user.name} 发起的 pull request`,
      description: contributeList.length
        ? `${user.name} 为 ${contributeString} 等 ${contributeList.length} 个 Galgame 提出了 pull request`
        : `用户 ${user.name} 暂无 pull request`,
      images: [{ url: user.avatar }],
      type: 'profile',
      username: user.name
    },
    twitter: {
      card: 'summary',
      title: `${user.name} 发起的 pull request`,
      description: contributeList.length
        ? `${user.name} 为 ${contributeString} 等 ${contributeList.length} 个 Galgame 提出了 pull request`
        : `用户 ${user.name} 暂无 pull request`,
      images: [user.avatar]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/user/${user.id}/contribute`
    }
  }
}
