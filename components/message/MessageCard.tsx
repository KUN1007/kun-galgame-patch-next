'use client'

import { Card, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Chip } from '@nextui-org/chip'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import {
  MonitorCog,
  Mail,
  Bell,
  Heart,
  MessageCircle,
  GitPullRequestArrow,
  Users,
  ThumbsUp
} from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import { MESSAGE_TYPE_MAP } from '~/constants/message'
import type { Message } from '~/types/api/message'

interface Props {
  msg: Message
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'system':
      return <MonitorCog className="w-5 h-5 text-secondary-500" />
    case 'pm':
      return <Mail className="w-5 h-5 text-secondary-500" />
    case 'like':
      return <ThumbsUp className="w-5 h-5 text-secondary-500" />
    case 'favorite':
      return <Heart className="w-5 h-5 text-danger-500" />
    case 'comment':
      return <MessageCircle className="w-5 h-5 text-primary-500" />
    case 'pr':
      return <GitPullRequestArrow className="w-5 h-5 text-success-500" />
    case 'follow':
      return <Users className="w-5 h-5 text-success-500" />
    default:
      return <Bell className="w-5 h-5 text-default-500" />
  }
}

const getCardRoute = (msg: Message) => {
  if (!msg.sender) {
    return '/'
  }

  if (msg.patch_id) {
    return `/patch/${msg.patch_id}/introduction`
  } else if (msg.comment_id) {
    return `/patch/${msg.patch_id}/comment`
  } else if (msg.patch_resource_id) {
    return `/patch/${msg.patch_id}/resource`
  } else {
    return `/user/${msg.sender?.id}/resource`
  }
}

export const MessageCard = ({ msg }: Props) => {
  const router = useRouter()
  const href = getCardRoute(msg)

  return (
    <Card
      key={msg.id}
      isPressable
      onPress={() => router.push(href)}
      className="w-full"
    >
      <CardBody className="flex flex-row items-center gap-4">
        {msg.sender ? (
          <Avatar src={msg.sender?.avatar} name={msg.sender?.name} />
        ) : (
          <Avatar src="/favicon.webp" name="系统消息" />
        )}

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {getNotificationIcon(msg.type)}

            <span className="font-semibold">
              {msg.sender ? msg.sender.name : '系统'}
            </span>

            <span>{MESSAGE_TYPE_MAP[msg.type]}</span>
          </div>
          <p className="text-gray-600">{msg.content}</p>
          <span className="text-sm text-gray-400">
            {formatDistanceToNow(msg.created)}
          </span>
        </div>
        {msg.status === 0 ? (
          <Chip color="danger" size="sm">
            新消息
          </Chip>
        ) : (
          <Chip color="default" size="sm">
            已阅读
          </Chip>
        )}
      </CardBody>
    </Card>
  )
}
