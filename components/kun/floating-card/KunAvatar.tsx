'use client'

import { Tooltip } from '@nextui-org/tooltip'
import { Avatar } from '@nextui-org/avatar'
import { KunUserCard } from './KunUserCard'
import { useRouter } from 'next-nprogress-bar'
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
  const router = useRouter()

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
      <Avatar
        name={username}
        alt={altString}
        className="transition-transform duration-200 cursor-pointer shrink-0 hover:scale-110"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()

          router.push(`/user/${uid}/resource`)
        }}
        {...rest}
      />
    </Tooltip>
  )
}
