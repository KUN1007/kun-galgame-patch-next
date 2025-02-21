'use client'

import { Chip } from '@nextui-org/react'
import { Image } from '@nextui-org/image'
import Link from 'next/link'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import type { AdminGalgame } from '~/types/api/admin'

export const RenderCell = (galgame: AdminGalgame, columnKey: string) => {
  switch (columnKey) {
    case 'banner':
      return (
        <Image
          alt={galgame.name}
          className="object-cover"
          width={128}
          src={galgame.banner.replace(/\.avif$/, '-mini.avif')}
          style={{ aspectRatio: '16/9' }}
        />
      )
    case 'name':
      return (
        <Link
          href={`/patch/${galgame.id}/introduction`}
          className="font-medium hover:text-primary-500"
        >
          {galgame.name}
        </Link>
      )
    case 'user':
      return (
        <KunUser
          user={galgame.user}
          userProps={{
            name: galgame.user.name,
            avatarProps: {
              src: galgame.user.avatar
            }
          }}
        />
      )
    case 'created':
      return (
        <Chip size="sm" variant="light">
          {formatDistanceToNow(galgame.created)}
        </Chip>
      )
    default:
      return (
        <Chip color="primary" variant="flat">
          咕咕咕
        </Chip>
      )
  }
}
