'use client'

import { Card, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Chip } from '@nextui-org/chip'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import {
  Bell,
  Heart,
  MessageCircle,
  GitPullRequestArrow,
  ThumbsUp
} from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import type { Message } from '~/types/api/message'

interface Props {
  msg: Message
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like':
      return <ThumbsUp className="w-5 h-5 text-secondary-500" />
    case 'favorite':
      return <Heart className="w-5 h-5 text-danger-500" />
    case 'comment':
      return <MessageCircle className="w-5 h-5 text-primary-500" />
    case 'pr':
      return <GitPullRequestArrow className="w-5 h-5 text-success-500" />
    default:
      return <Bell className="w-5 h-5 text-default-500" />
  }
}

const getMessageName = (type: string) => {
  switch (type) {
    case 'like':
      return '点赞了'
    case 'favorite':
      return '收藏了'
    case 'comment':
      return '评论了'
    case 'pr':
      return '更新请求'
    default:
      return ''
  }
}

const getCardRoute = (msg: Message) => {
  if (msg.patch_id) {
    return `/patch/${msg.patch_id}/introduction`
  } else if (msg.comment_id) {
    return `/patch/${msg.patch_id}/comment`
  } else if (msg.patch_resource_id) {
    return `/patch/${msg.patch_id}/resource`
  } else {
    return `/user/${msg.sender.id}/resource`
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
        <Avatar src={msg.sender.avatar} name={msg.sender.name} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {getNotificationIcon(msg.type)}
            <span className="font-semibold">{msg.sender.name}</span>
            <span>{getMessageName(msg.type)}</span>
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
