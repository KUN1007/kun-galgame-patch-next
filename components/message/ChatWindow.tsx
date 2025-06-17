'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card'
import { Avatar } from '@heroui/avatar'
import { Textarea } from '@heroui/input'
import { Button } from '@heroui/button'
import { ChevronLeft, SendHorizontal, MoreVertical } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  ModalFooter,
  ScrollShadow,
  useDisclosure
} from '@heroui/react'
import toast from 'react-hot-toast'
import { useSocket } from '~/context/SocketProvider'
import { kunFetchGet } from '~/utils/kunFetch'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll'
import {
  MAX_CHAT_MESSAGE_PER_REQUEST,
  USER_IS_TYPING_DURATION
} from '~/constants/chat'
import { KunLoading } from '../kun/Loading'
import { ReplyPreviewBanner } from './ReplyPreviewBanner'
import { UserTypingIndicator } from './UserTypingIndicator'
import { useHotkeys } from 'react-hotkeys-hook'
import { useDebounce, useDebouncedCallback } from 'use-debounce'
import type {
  ChatRoom,
  ChatMessage as ChatMessageType,
  ChatMessagesApiResponse,
  ChatMessageReaction
} from '~/types/api/chat'
import Link from 'next/link'

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
  const [debouncedInputValue] = useDebounce(inputValue, 500)
  const { socket, isConnected } = useSocket()

  // State for Infinite Scroll
  const [historyCursor, setHistoryCursor] = useState<number | null>(
    initialMessages.length > 0 ? initialMessages[0].id : null
  )
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasMoreHistory, setHasMoreHistory] = useState(
    initialMessages.length >= MAX_CHAT_MESSAGE_PER_REQUEST
  )

  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessageType | null>(
    null
  )
  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit
  } = useDisclosure()

  const [typingUsers, setTypingUsers] = useState<Record<number, KunUser>>({})

  // xxx is typing...
  useEffect(() => {
    if (!socket || !isConnected) {
      return
    }

    if (debouncedInputValue.length > 0) {
      socket.emit(KUN_CHAT_EVENT.USER_TYPING, {
        roomId: chatroom.id,
        isTyping: true
      })

      const timerId = setTimeout(() => {
        socket.emit(KUN_CHAT_EVENT.USER_TYPING, {
          roomId: chatroom.id,
          isTyping: false
        })
      }, USER_IS_TYPING_DURATION)

      return () => {
        clearTimeout(timerId)
      }
    } else {
      socket.emit(KUN_CHAT_EVENT.USER_TYPING, {
        roomId: chatroom.id,
        isTyping: false
      })
    }
  }, [debouncedInputValue, socket, isConnected, chatroom.id])

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
        toast.error('加载历史消息错误, 请重试')
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
    if (!socket) return

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

    const handleReactionUpdate = ({
      messageId,
      reaction
    }: {
      messageId: number
      reaction: ChatMessageReaction[]
    }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return { ...msg, reaction }
          }
          return msg
        })
      )
    }

    const handleUserTyping = ({
      roomId,
      isTyping,
      user
    }: {
      roomId: number
      isTyping: boolean
      user: KunUser
    }) => {
      if (roomId !== chatroom.id) return

      setTypingUsers((prev) => {
        const newTypingUsers = { ...prev }
        if (isTyping) {
          newTypingUsers[user.id] = user
        } else {
          delete newTypingUsers[user.id]
        }
        return newTypingUsers
      })
    }

    socket.on(KUN_CHAT_EVENT.USER_TYPING, handleUserTyping)
    socket.on(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleReceiveMessage)
    socket.on(KUN_CHAT_EVENT.DELETE_MESSAGE, handleDeleteMessage)
    socket.on(KUN_CHAT_EVENT.REACTION_UPDATED, handleReactionUpdate)

    return () => {
      socket.off(KUN_CHAT_EVENT.USER_TYPING)
      socket.off(KUN_CHAT_EVENT.RECEIVE_MESSAGE)
      socket.off(KUN_CHAT_EVENT.DELETE_MESSAGE)
      socket.off(KUN_CHAT_EVENT.REACTION_UPDATED)
    }
  }, [socket, chatroom.id])

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
      scrollContainer.scrollTop =
        scrollContainer.scrollHeight - scrollHeightBeforeUpdate
    }
  }, [scrollHeightBeforeUpdate])

  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket) return

    socket.emit(KUN_CHAT_EVENT.SEND_MESSAGE, {
      roomId: chatroom.id,
      content: inputValue,
      replyToId: replyingTo?.id
    })

    setInputValue('')
    setReplyingTo(null)
  }

  useHotkeys(
    'ctrl+enter, cmd+enter',
    (event) => {
      event.preventDefault()
      handleSendMessage()
    },
    { enableOnFormTags: true }
  )

  const handleSaveEdit = useDebouncedCallback(() => {
    if (!socket || !editingMessage) return
    socket.emit(KUN_CHAT_EVENT.EDIT_MESSAGE, {
      messageId: editingMessage.id,
      newContent: editingMessage.content
    })
    setMessages((prev) =>
      prev.map((msg) => (msg.id === editingMessage.id ? editingMessage : msg))
    )
    setEditingMessage(null)
    onCloseEdit()
  }, 500)

  return (
    <Card className="flex flex-col h-full h-[48rem]">
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
            <span className="text-xs text-default-500">
              {chatroom.type === 'GROUP' ? '群聊' : '在线'}
            </span>
          </div>
        </div>

        <UserTypingIndicator users={typingUsers} />

        <div className="flex items-center gap-2">
          <Button isIconOnly variant="light" aria-label="更多选项">
            <MoreVertical size={20} />
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        <ScrollShadow ref={scrollRef}>
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
              onReply={() => setReplyingTo(msg)}
              onEdit={() => {
                setEditingMessage(msg)
                onOpenEdit()
              }}
            />
          ))}
        </ScrollShadow>

        <Modal isOpen={isOpenEdit} onClose={onCloseEdit}>
          <ModalContent>
            <ModalHeader className="flex-col space-y-2">
              <h3 className="text-lg">重新编辑消息</h3>
              <p className="text-sm font-medium text-default-500">
                系统不会显示您编辑之前的消息, 但是消息的时间前会增加 “已编辑”
                提示
              </p>
            </ModalHeader>

            <ModalBody>
              {editingMessage && (
                <Textarea
                  value={editingMessage.content}
                  onValueChange={(value) =>
                    setEditingMessage({ ...editingMessage, content: value })
                  }
                  autoFocus
                  minRows={1}
                />
              )}
            </ModalBody>

            <ModalFooter>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="light" color="danger" onPress={onCloseEdit}>
                  取消
                </Button>
                <Button color="primary" onPress={handleSaveEdit}>
                  保存
                </Button>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardBody>

      <CardFooter className="shrink-0 flex-col">
        {replyingTo && (
          <ReplyPreviewBanner
            message={{
              content: replyingTo.content,
              senderName: replyingTo.sender.name
            }}
            onClose={() => setReplyingTo(null)}
          />
        )}

        <div className="flex w-full gap-2">
          <Textarea
            minRows={1}
            placeholder={
              isConnected ? '输入消息... (Ctrl + 回车发送)' : '正在连接...'
            }
            value={inputValue}
            onValueChange={(value) => setInputValue(value)}
            disabled={!isConnected}
          />
          <Button
            isIconOnly
            color="primary"
            aria-label="发送消息"
            onPress={handleSendMessage}
          >
            <SendHorizontal />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
