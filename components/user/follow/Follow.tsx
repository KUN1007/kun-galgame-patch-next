'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/react'
import { Plus, Check } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import { useUserStore } from '~/store/userStore'
import type { UserInfo } from '~/types/api/user'

interface Props {
  user: UserInfo
}

export const UserFollow = ({ user }: Props) => {
  const [isFollow, setIsFollow] = useState(user.isFollow)
  const currentUser = useUserStore((state) => state.user)
  const [following, setFollowing] = useState(false)

  const isCurrentUser = user.id === currentUser.uid

  const handleFollow = async () => {
    setFollowing(true)

    await api.user.followUser.mutate({
      uid: user.id
    })

    setFollowing(false)
  }

  return (
    <>
      {!isCurrentUser && (
        <Button
          startContent={
            isFollow ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )
          }
          color={isFollow ? 'success' : 'primary'}
          variant="flat"
          fullWidth
          onClick={handleFollow}
          isDisabled={following}
          isLoading={following}
        >
          {isFollow ? '已关注' : '关注'}
        </Button>
      )}
    </>
  )
}
