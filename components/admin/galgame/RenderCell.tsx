'use client'

import { Chip } from '@heroui/react'
import { Image } from '@heroui/image'
import Link from 'next/link'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { AdminGalgame } from '~/types/api/admin'

export const RenderCell = (galgame: AdminGalgame, columnKey: string) => {
  const galgameName = getPreferredLanguageText(galgame.name)

  switch (columnKey) {
    case 'banner':
      return (
        <Image
          alt={galgameName}
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
          {galgameName}
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
