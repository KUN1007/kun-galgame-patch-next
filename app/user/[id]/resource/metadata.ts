import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'
import type { UserResource } from '~/types/api/user'

export const generateKunMetadataTemplate = (
  user: UserInfo,
  resources: UserResource[]
): Metadata => {
  const resourceList = resources.map((res) => res.patchName)
  const resourceString = resourceList.toString().slice(0, 170)

  return {
    title: `${user.name} 发布的补丁资源 - ${kunMoyuMoe.titleShort}`,
    description: resourceList.length
      ? `查看 ${resourceString} 等 ${resourceList.length}+ 个补丁资源`
      : `用户 ${user.name} 还没有发布过补丁资源哦`,
    openGraph: {
      title: `${user.name} 发布的补丁资源`,
      description: resourceList
        ? `查看 ${resourceString} 等 ${resourceList.length}+ 个补丁资源`
        : `用户 ${user.name} 还没有发布过补丁资源哦`,
      images: [{ url: user.avatar }],
      type: 'profile',
      username: user.name
    },
    twitter: {
      card: 'summary',
      title: `${user.name} 发布的补丁资源`,
      description: resourceList
        ? `查看 ${resourceString} 等 ${resourceList.length}+ 个补丁资源`
        : `用户 ${user.name} 还没有发布过补丁资源哦`,
      images: [user.avatar]
    }
  }
}
