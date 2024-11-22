'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@nextui-org/card'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure
} from '@nextui-org/modal'
import { Avatar } from '@nextui-org/avatar'
import { Button } from '@nextui-org/button'
import { Chip } from '@nextui-org/chip'
import { Divider } from '@nextui-org/divider'
import { Progress } from '@nextui-org/progress'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import {
  Plus,
  Mail,
  Calendar,
  Link as LinkIcon,
  Users,
  Telescope
} from 'lucide-react'
import { UserFollow } from './follow/Follow'
import { UserList } from './follow/UserList'
import { api } from '~/lib/trpc-client'
import type { UserInfo } from '~/types/api/user'

export const UserProfile = ({ user }: { user: UserInfo }) => {
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
    <div className="lg:col-span-1">
      <Card className="w-full">
        <CardHeader className="justify-center pt-8">
          <div className="flex flex-col items-center gap-3">
            <Avatar
              src={user.avatar.replace('-mini', '')}
              className="w-32 h-32"
              isBordered
              color="primary"
            />
            <div className="flex flex-col items-center gap-1">
              <h4 className="text-2xl font-bold">{user.name}</h4>
              <Chip color="primary" variant="flat" size="sm" className="mt-1">
                {user.role}
              </Chip>

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
                  startContent={
                    <Telescope className="w-4 h-4 text-default-400" />
                  }
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
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-6 py-4">
          {user.bio && (
            <p className="mb-6 text-center text-default-600">{user.bio}</p>
          )}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-default-400" />
              <a
                href={`https://www.moyu.moe/user/${user.id}`}
                className="text-small text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`https://www.moyu.moe/user/${user.id}`}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-default-400" />
              <span className="text-small text-default-500">
                加入于 {formatDistanceToNow(user.registerTime)}
              </span>
            </div>
          </div>
          <Divider className="my-4" />
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-small">萌萌点</span>
                <span className="text-small text-default-500">
                  {user.moemoepoint}
                </span>
              </div>
              <Progress
                aria-label="moemoepoint"
                value={user.moemoepoint / 20}
                color="primary"
                className="h-2"
              />
            </div>

            <div className="flex gap-2">
              <UserFollow user={user} />

              <Button
                startContent={<Mail className="w-4 h-4" />}
                color="default"
                variant="flat"
                fullWidth
              >
                Message
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
