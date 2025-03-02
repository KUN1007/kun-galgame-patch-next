'use client'

import { useEffect, useState } from 'react'
import { useMounted } from '~/hooks/useMounted'
import { Pagination } from '@nextui-org/pagination'
import { KunLoading } from '~/components/kun/Loading'
import { MessageCard } from './MessageCard'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunNull } from '~/components/kun/Null'
import { MESSAGE_TYPE } from '~/constants/message'
import toast from 'react-hot-toast'
import type { Message } from '~/types/api/message'

interface Props {
  initialMessages: Message[]
  total: number
  type?: (typeof MESSAGE_TYPE)[number]
}

export const MessageContainer = ({ initialMessages, total, type }: Props) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const isMounted = useMounted()

  const fetchMessages = async () => {
    setLoading(true)

    const response = await kunFetchGet<
      KunResponse<{
        messages: Message[]
        total: number
      }>
    >('/message/all', {
      type: type ?? '',
      page,
      limit: 30
    })
    if (typeof response === 'string') {
      toast.error(response)
    } else {
      setMessages(response.messages)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchMessages()
  }, [page])

  if (!initialMessages.length) {
    return <KunNull message="暂无消息" />
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <KunLoading hint="正在获取消息数据..." />
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageCard key={msg.id} msg={msg} />
          ))}
        </div>
      )}

      {total > 30 && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 30)}
            page={page}
            onChange={(newPage: number) => setPage(newPage)}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </div>
  )
}
