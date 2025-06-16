'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card'
import { Avatar } from '@heroui/avatar'
import { Textarea } from '@heroui/input'
import { Button } from '@heroui/button'
import { SendHorizontal, MoreVertical } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { ScrollShadow } from '@heroui/react'
import toast from 'react-hot-toast'
import { useSocket } from '~/context/SocketProvider'
import { kunFetchGet } from '~/utils/kunFetch'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll'
import { MAX_CHAT_MESSAGE_PER_REQUEST } from '~/constants/chat'
import type {
  ChatRoom,
  ChatMessage as ChatMessageType,
  ChatMessagesApiResponse
} from '~/types/api/chat'
import { KunLoading } from '../kun/Loading'

interface Props {
  chatroom: ChatRoom
  initialMessages: ChatMessageType[]
  currentUserId: number
}

export const ChatWindow = ({
  chatroom,
  initialMessages,
  currentUserId
}: Props) => {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const { socket, isConnected } = useSocket()

  // State for Infinite Scroll
  const [historyCursor, setHistoryCursor] = useState<number | null>(
    initialMessages.length > 0 ? initialMessages[0].id : null
  )
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasMoreHistory, setHasMoreHistory] = useState(
    initialMessages.length >= MAX_CHAT_MESSAGE_PER_REQUEST
  )

  const fetchHistory = async () => {
    if (!hasMoreHistory || !historyCursor) return []
    setIsLoadingHistory(true)
    try {
      const response = await kunFetchGet<KunResponse<ChatMessagesApiResponse>>(
        `/chat-room/message`,
        {
          link: chatroom.link,
          cursor: historyCursor,
          limit: MAX_CHAT_MESSAGE_PER_REQUEST
        }
      )
      if (typeof response === 'string') {
        toast.error('Failed to load history')
        setHasMoreHistory(false)
        return []
      }

      const { messages: newHistory, nextCursor } = response

      setMessages((prev) => [...newHistory, ...prev])
      setHistoryCursor(nextCursor)
      setHasMoreHistory(nextCursor !== null)

      return newHistory
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const { scrollRef, scrollHeightBeforeUpdate } = useInfiniteScroll<
    HTMLDivElement,
    KunResponse<ChatMessagesApiResponse>
  >({
    fetchMore: fetchHistory,
    hasMore: hasMoreHistory,
    isLoading: isLoadingHistory
  })

  // Socket.IO listeners, smart auto-scrolling
  useEffect(() => {
    if (!socket) {
      return
    }

    const handleReceiveMessage = (newMessage: ChatMessageType) => {
      if (newMessage.chat_room_id !== chatroom.id) return

      const scrollContainer = scrollRef.current
      const isScrolledToBottom = scrollContainer
        ? scrollContainer.scrollHeight - scrollContainer.clientHeight <=
          scrollContainer.scrollTop + 100
        : false

      setMessages((prev) => [...prev, newMessage])

      // Auto-scroll only if user is already near the bottom or sent the message themselves
      if (isScrolledToBottom || newMessage.sender_id === currentUserId) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          })
        }, 100)
      }
    }

    const handleDeleteMessage = ({
      messageId,
      roomId
    }: {
      messageId: number
      roomId: number
    }) => {
      if (roomId === chatroom.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: 'DELETED', content: '', file_url: '' }
              : msg
          )
        )
      }
    }

    socket.on(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleReceiveMessage)
    socket.on(KUN_CHAT_EVENT.DELETE_MESSAGE, handleDeleteMessage)

    return () => {
      socket.off(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleReceiveMessage)
      socket.off(KUN_CHAT_EVENT.DELETE_MESSAGE, handleDeleteMessage)
    }
  }, [socket, chatroom.id])

  // Initial Scroll to Bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatroom.id])

  // --- **THE KEY TO SMOOTH SCROLLING** ---
  // This effect runs after the DOM is updated but before the browser paints,
  // preventing any scroll jump.
  useLayoutEffect(() => {
    const scrollContainer = scrollRef.current
    if (scrollContainer && scrollHeightBeforeUpdate > 0) {
      // Adjust scroll position to keep the user's view stable
      scrollContainer.scrollTop =
        scrollContainer.scrollHeight - scrollHeightBeforeUpdate
    }
  }, [messages, scrollHeightBeforeUpdate])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !socket) return

    // send with socket.emit, wait the server broadcast
    socket.emit(KUN_CHAT_EVENT.SEND_MESSAGE, {
      roomId: chatroom.id,
      content: inputValue
    })

    setInputValue('')
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={chatroom.avatar} name={chatroom.name} />
          <div className="flex flex-col">
            <span className="font-semibold">{chatroom.name}</span>
            <span className="text-xs text-default-500">
              {chatroom.type === 'GROUP' ? '群聊' : '在线'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button isIconOnly variant="light" aria-label="更多选项">
            <MoreVertical size={20} />
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        <ScrollShadow ref={scrollRef} className="p-4 space-y-4">
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
            />
          ))}
        </ScrollShadow>
      </CardBody>

      <CardFooter>
        <form
          onSubmit={handleSendMessage}
          className="flex items-center w-full py-6 gap-2"
        >
          <Textarea
            minRows={1}
            placeholder={isConnected ? '输入消息...' : '正在连接...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!isConnected}
          />
          <Button
            type="submit"
            isIconOnly
            color="primary"
            aria-label="发送消息"
          >
            <SendHorizontal />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
