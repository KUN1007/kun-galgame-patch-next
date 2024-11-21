'use client'

import { useState, useEffect } from 'react'
import { useMounted } from '~/hooks/useMounted'
import { Pagination } from '@nextui-org/pagination'
import { KunLoading } from '~/components/kun/Loading'
import { MessageCard } from './MessageCard'
import { api } from '~/lib/trpc-client'
import type { Message } from '~/types/api/message'

interface Props {
  initialMessages: Message[]
  total: number
}

export const MessageContainer = ({ initialMessages, total }: Props) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const isMounted = useMounted()

  const fetchMessages = async () => {
    setLoading(true)
    const { messages } = await api.message.getMessage.query({
      page,
      limit: 30
    })
    setMessages(messages)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchMessages()
  }, [page])

  return (
    <>
      {loading ? (
        <KunLoading hint="正在获取补丁数据..." />
      ) : (
        <>
          {messages.map((msg) => (
            <MessageCard key={msg.id} msg={msg} />
          ))}
        </>
      )}

      {total > 24 && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 24)}
            page={page}
            onChange={(newPage: number) => setPage(newPage)}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </>
  )
}
