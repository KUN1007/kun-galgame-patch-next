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
import { kunFetchPost } from '~/utils/kunFetch'
import { Plus, Check } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import { useUserStore } from '~/store/providers/user'
import { useErrorHandler } from '~/hooks/useErrorHandler'

interface Props {
  uid: number
  name: string
  follow: boolean
  fullWidth?: boolean
}

export const UserFollow = ({ uid, name, follow, fullWidth = true }: Props) => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isFollow, setIsFollow] = useState(follow)
  const [following, setFollowing] = useState(false)

  const handleUnfollow = async () => {
    setFollowing(true)
    const res = await kunFetchPost<KunResponse<{}>>('/user/follow/unfollow', {
      uid
    })
    useErrorHandler(res, () => {
      setIsFollow(false)
      onClose()
    })
    setFollowing(false)
  }

  const handleFollow = async () => {
    setFollowing(true)

    if (isFollow) {
      onOpen()
    } else {
      const res = await kunFetchPost('/user/follow/follow', { uid })
      useErrorHandler(res, () => {})
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
        fullWidth={fullWidth}
        onClick={handleFollow}
        isDisabled={following || user.uid === uid}
        isLoading={following}
      >
        {isFollow ? '已关注' : '关注'}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">取消关注</ModalHeader>
          <ModalBody>
            <p>您确定要取消关注 {name} 吗?</p>
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
