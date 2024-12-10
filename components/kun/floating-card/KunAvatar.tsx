import { Tooltip } from '@nextui-org/tooltip'
import { Avatar } from '@nextui-org/avatar'
import Link from 'next/link'
import { KunUserCard } from './KunUserCard'
import type { AvatarProps } from '@nextui-org/avatar'

interface KunAvatarProps extends AvatarProps {
  name: string
  src: string
}

interface Props {
  uid: number
  avatarProps: KunAvatarProps
}

export const KunAvatar = ({ uid, avatarProps }: Props) => {
  const { alt, name, ...rest } = avatarProps
  const username = name?.charAt(0).toUpperCase() ?? '杂鱼'
  const altString = alt ? alt : username

  return (
    <Tooltip
      showArrow
      delay={500}
      closeDelay={0}
      content={<KunUserCard uid={uid} />}
    >
      <Link href={`/user/${uid}/resource`} className="block w-fit">
        <Avatar
          name={username}
          alt={altString}
          className="cursor-pointer shrink-0"
          {...rest}
        />
      </Link>
    </Tooltip>
  )
}
