'use client'

import { useState } from 'react'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure
} from '@nextui-org/modal'
import { Button } from '@nextui-org/button'
import { Telescope, Users } from 'lucide-react'
import { UserList } from './UserList'
import type { UserInfo } from '~/types/api/user'

export const Stats = ({ user }: { user: UserInfo }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    'followers'
  )

  const showFollowers = () => {
    setActiveTab('followers')
    onOpen()
  }

  const showFollowing = () => {
    setActiveTab('following')
    onOpen()
  }

  return (
    <>
      <div className="flex gap-4 mt-2">
        <Button
          variant="light"
          onPress={showFollowers}
          startContent={<Users className="size-4 text-default-400" />}
        >
          {user.follower}
          <span className="text-default-500">人关注 TA</span>
        </Button>
        <Button
          variant="light"
          onPress={showFollowing}
          startContent={<Telescope className="size-4 text-default-400" />}
        >
          {user.following}
          <span className="text-default-500">正在关注</span>
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior="inside"
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl">
              {activeTab === 'followers'
                ? `关注 ${user.name} 的人`
                : `${user.name} 正在关注的人`}
            </h3>
          </ModalHeader>
          <ModalBody className="py-4">
            <UserList userId={user.id} type={activeTab} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
