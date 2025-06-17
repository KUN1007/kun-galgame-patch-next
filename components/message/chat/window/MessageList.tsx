'use client'

import { useLayoutEffect } from 'react'
import { CardBody } from '@heroui/card'
import { ScrollShadow } from '@heroui/react'
import { KunLoading } from '~/components/kun/Loading'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType, ChatRoom } from '~/types/api/chat'

interface Props {
  messages: ChatMessageType[]
  chatroom: ChatRoom
  currentUserId: number
  isLoadingHistory: boolean
  scrollRef: React.RefObject<HTMLDivElement | null>
  scrollHeightBeforeUpdate: number
  onReply: (message: ChatMessageType) => void
  onEdit: (message: ChatMessageType) => void
}

export const MessageList = ({
  messages,
  chatroom,
  currentUserId,
  isLoadingHistory,
  scrollRef,
  scrollHeightBeforeUpdate,
  onReply,
  onEdit
}: Props) => {
  // --- **THE KEY TO SMOOTH SCROLLING** ---
  // This effect runs after the DOM is updated but before the browser paints,
  // preventing any scroll jump.
  useLayoutEffect(() => {
    const scrollContainer = scrollRef.current
    if (scrollContainer && scrollHeightBeforeUpdate > 0) {
      scrollContainer.scrollTop =
        scrollContainer.scrollHeight - scrollHeightBeforeUpdate
    }
  }, [scrollHeightBeforeUpdate, scrollRef])

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatroom.id, scrollRef])

  return (
    <CardBody className="px-3 py-0">
      <ScrollShadow visibility="none" ref={scrollRef}>
        {isLoadingHistory && (
          <div className="h-16">
            <KunLoading hint="正在加载历史消息..." />
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isOwnMessage={msg.sender_id === currentUserId}
            isGroupChat={chatroom.type === 'GROUP'}
            onReply={() => onReply(msg)}
            onEdit={() => onEdit(msg)}
          />
        ))}
      </ScrollShadow>
    </CardBody>
  )
}
