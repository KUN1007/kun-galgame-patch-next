import { useState } from 'react'
import toast from 'react-hot-toast'
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll'
import { kunFetchGet } from '~/utils/kunFetch'
import { MAX_CHAT_MESSAGE_PER_REQUEST } from '~/constants/chat'
import type { ChatMessage, ChatMessagesApiResponse } from '~/types/api/chat'

export const useChatMessage = (
  initialMessages: ChatMessage[],
  chatroomLink: string
) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)

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
          link: chatroomLink,
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

  return {
    messages,
    setMessages,
    isLoadingHistory,
    scrollRef,
    scrollHeightBeforeUpdate
  }
}
