import { useEffect, useState } from 'react'
import { useSocket } from '~/context/SocketProvider'
import { KUN_CHAT_EVENT, USER_IS_TYPING_DURATION } from '~/constants/chat'
import { useDebounce } from 'use-debounce'
import type { ChatMessage, ChatMessageReaction } from '~/types/api/chat'

interface Props {
  chatroomId: number
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  inputValue: string
  currentUserId: number
  scrollRef: React.RefObject<HTMLDivElement | null>
}

export const useChatSocket = ({
  chatroomId,
  setMessages,
  inputValue,
  currentUserId,
  scrollRef
}: Props) => {
  const { socket, isConnected } = useSocket()
  const [debouncedInputValue] = useDebounce(inputValue, 500)
  const [typingUsers, setTypingUsers] = useState<Record<number, KunUser>>({})
  const [onlineCount, setOnlineCount] = useState<number>(1)

  useEffect(() => {
    if (!socket || !isConnected) return

    const handleReceiveMessage = (newMessage: ChatMessage) => {
      if (newMessage.chat_room_id !== chatroomId) return

      const scrollContainer = scrollRef.current
      const isScrolledToBottom = scrollContainer
        ? scrollContainer.scrollHeight - scrollContainer.clientHeight <=
          scrollContainer.scrollTop + 100
        : false

      setMessages((prev) => [...prev, newMessage])

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
      if (roomId === chatroomId) {
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
        prev.map((msg) => (msg.id === messageId ? { ...msg, reaction } : msg))
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
      if (roomId !== chatroomId) return
      setTypingUsers((prev) => {
        const newTypingUsers = { ...prev }
        if (isTyping) newTypingUsers[user.id] = user
        else delete newTypingUsers[user.id]
        return newTypingUsers
      })
    }

    const handleRoomStatusUpdate = ({
      roomId,
      onlineCount
    }: {
      roomId: number
      onlineCount: number
    }) => {
      if (roomId === chatroomId) setOnlineCount(onlineCount)
    }

    socket.on(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleReceiveMessage)
    socket.on(KUN_CHAT_EVENT.DELETE_MESSAGE, handleDeleteMessage)
    socket.on(KUN_CHAT_EVENT.REACTION_UPDATED, handleReactionUpdate)
    socket.on(KUN_CHAT_EVENT.USER_TYPING, handleUserTyping)
    socket.on(KUN_CHAT_EVENT.ROOM_STATUS_UPDATE, handleRoomStatusUpdate)

    return () => {
      socket.off(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleReceiveMessage)
      socket.off(KUN_CHAT_EVENT.DELETE_MESSAGE, handleDeleteMessage)
      socket.off(KUN_CHAT_EVENT.REACTION_UPDATED, handleReactionUpdate)
      socket.off(KUN_CHAT_EVENT.USER_TYPING, handleUserTyping)
      socket.off(KUN_CHAT_EVENT.ROOM_STATUS_UPDATE, handleRoomStatusUpdate)
    }
  }, [socket, isConnected, chatroomId, setMessages, currentUserId, scrollRef])

  useEffect(() => {
    if (!socket || !isConnected) return

    if (debouncedInputValue.length > 0) {
      socket.emit(KUN_CHAT_EVENT.USER_TYPING, {
        roomId: chatroomId,
        isTyping: true
      })
      const timerId = setTimeout(() => {
        socket.emit(KUN_CHAT_EVENT.USER_TYPING, {
          roomId: chatroomId,
          isTyping: false
        })
      }, USER_IS_TYPING_DURATION)
      return () => clearTimeout(timerId)
    } else {
      socket.emit(KUN_CHAT_EVENT.USER_TYPING, {
        roomId: chatroomId,
        isTyping: false
      })
    }
  }, [debouncedInputValue, socket, isConnected, chatroomId])

  return { isConnected, typingUsers, onlineCount }
}
