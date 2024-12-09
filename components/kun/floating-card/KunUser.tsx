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
        <User {...userProps} className="cursor-pointer" />
      </Link>
    </Tooltip>
  )
}
