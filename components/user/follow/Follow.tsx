'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/modal'
import { Plus, Check } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import { useRouter } from 'next-nprogress-bar'
import type { UserInfo } from '~/types/api/user'

interface Props {
  user: UserInfo
}

export const UserFollow = ({ user }: Props) => {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isFollow, setIsFollow] = useState(user.isFollow)
  const [following, setFollowing] = useState(false)

  const handleUnfollow = async () => {
    setFollowing(true)
    await api.user.unfollowUser.mutate({
      uid: user.id
    })
    setIsFollow(false)
    setFollowing(false)
    onClose()
  }

  const handleFollow = async () => {
    setFollowing(true)

    if (isFollow) {
      onOpen()
    } else {
      await api.user.followUser.mutate({
        uid: user.id
      })
      setIsFollow(true)
    }

    router.refresh()
    setFollowing(false)
  }

  return (
    <>
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

      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">取消关注</ModalHeader>
          <ModalBody>
            <p>您确定要取消关注 {user.name} 吗?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="danger"
              onPress={handleUnfollow}
              isDisabled={following}
              isLoading={following}
            >
              取消关注
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
