'use client'

import { memo } from 'react'
import { CardHeader } from '@heroui/card'
import { Avatar } from '@heroui/avatar'
import { Button } from '@heroui/button'
import { ChevronLeft, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { UserTypingIndicator } from './UserTypingIndicator'
import type { ChatRoom } from '~/types/api/chat'

interface ChatHeaderProps {
  chatroom: ChatRoom
  onlineCount: number
  typingUsers: Record<number, KunUser>
}

export const ChatHeader = memo(
  ({ chatroom, onlineCount, typingUsers }: ChatHeaderProps) => {
    const handleMoreAction = () => {
      toast.success('杂鱼杂鱼杂鱼, 功能正在开发中...')
    }

    const hasTypingUsers = Object.keys(typingUsers).length > 0

    return (
      <CardHeader className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            as={Link}
            href="/message/chat"
            variant="light"
            aria-label="返回"
          >
            <ChevronLeft size={20} />
          </Button>
          <Avatar src={chatroom.avatar} name={chatroom.name} />
          <div className="flex flex-col">
            <span className="font-semibold">{chatroom.name}</span>
            {hasTypingUsers ? (
              <UserTypingIndicator users={typingUsers} />
            ) : (
              <p className="text-xs text-default-500">{`共 ${chatroom.memberCount} 人, ${onlineCount} 在线`}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            variant="light"
            aria-label="更多选项"
            onPress={handleMoreAction}
          >
            <MoreVertical size={20} />
          </Button>
        </div>
      </CardHeader>
    )
  }
)

ChatHeader.displayName = 'ChatHeader'
