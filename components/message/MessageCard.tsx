'use client'

import { Card, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Chip } from '@nextui-org/chip'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { Bell, Heart, MessageCircle, UserPlus, Globe } from 'lucide-react'
import type { Message } from '~/types/api/message'

interface Props {
  msg: Message
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'LIKE':
      return <Heart className="w-5 h-5 text-danger-500" />
    case 'COMMENT':
      return <MessageCircle className="w-5 h-5 text-primary-500" />
    case 'FOLLOW':
      return <UserPlus className="w-5 h-5 text-success-500" />
    case 'SYSTEM':
      return <Globe className="w-5 h-5 text-secondary-500" />
    default:
      return <Bell className="w-5 h-5 text-default-500" />
  }
}

export const MessageCard = ({ msg }: Props) => {
  return (
    <Card key={msg.id}>
      <CardBody className="flex flex-row items-center gap-4">
        <Avatar src={msg.sender.avatar} name={msg.sender.name} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getNotificationIcon(msg.type)}
            <span className="font-semibold">{msg.sender.name}</span>
          </div>
          <p className="text-gray-600">{msg.content}</p>
          <span className="text-sm text-gray-400">
            {formatDistanceToNow(msg.created)}
          </span>
        </div>
        {msg.status === 0 && (
          <Chip color="danger" size="sm">
            新消息
          </Chip>
        )}
      </CardBody>
    </Card>
  )
}
