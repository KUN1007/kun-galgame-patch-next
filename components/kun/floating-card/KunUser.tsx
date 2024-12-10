import { Tooltip } from '@nextui-org/tooltip'
import { User } from '@nextui-org/user'
import Link from 'next/link'
import { KunUserCard } from './KunUserCard'
import type { UserProps } from '@nextui-org/user'

interface KunUserProps {
  user: KunUser
  userProps: UserProps
}

export const KunUser = ({ user, userProps }: KunUserProps) => {
  const { avatarProps, ...restUser } = userProps
  const { alt, name, ...restAvatar } = avatarProps!
  const username = name?.charAt(0).toUpperCase() ?? '杂鱼'
  const altString = alt ? alt : username

  return (
    <Tooltip
      showArrow
      delay={500}
      closeDelay={200}
      content={<KunUserCard uid={user.id} />}
      classNames={{
        content: ['bg-background/70 backdrop-blur-md']
      }}
    >
      <Link href={`/user/${user.id}/resource`} className="block w-fit">
        <User
          {...restUser}
          avatarProps={{
            name: username,
            alt: altString,
            className: 'shrink-0',
            ...restAvatar
          }}
          className="cursor-pointer"
        />
      </Link>
    </Tooltip>
  )
}
