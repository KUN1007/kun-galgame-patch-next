'use client'

import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure
} from '@nextui-org/modal'
import { Button } from '@nextui-org/button'
import { Users, Telescope } from 'lucide-react'
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
          onClick={showFollowers}
          startContent={<Users className="w-4 h-4 text-default-400" />}
        >
          {user.follower}
          <span className="text-default-500">人关注TA</span>
        </Button>
        <Button
          variant="light"
          onClick={showFollowing}
          startContent={<Telescope className="w-4 h-4 text-default-400" />}
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
              {activeTab === 'followers' ? 'Followers' : 'Following'}
            </h3>
          </ModalHeader>
          <ModalBody>
            <UserList userId={user.id} type={activeTab} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
