import { Tooltip } from '@nextui-org/tooltip'
import { Avatar } from '@nextui-org/avatar'
import Link from 'next/link'
import { KunUserCard } from './KunUserCard'
import type { AvatarProps } from '@nextui-org/avatar'

interface KunAvatarProps {
  user: KunUser
}

export const KunAvatar = ({ user }: KunAvatarProps) => {
  return (
    <Tooltip
      showArrow
      placement="right"
      delay={500}
      closeDelay={0}
      content={<KunUserCard uid={user.id} />}
    >
      <Link href={`/users/${user.id}`} className="block w-fit">
        <Avatar
          src={user.avatar}
          className="w-10 h-10 transition-transform cursor-pointer hover:scale-105"
          isBordered
          showFallback
          name={user.name}
        />
      </Link>
    </Tooltip>
  )
}
