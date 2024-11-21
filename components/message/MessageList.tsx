'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, Avatar, Button, Pagination } from '@nextui-org/react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { Bell, Heart, MessageCircle, UserPlus, Globe } from 'lucide-react'
import type { Message } from '~/types/api/message'

interface Props {
  userId: number
  activeType: string | null
}

export const MessageList = ({ userId, activeType }: Props) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchMessages = async () => {}

  useEffect(() => {
    fetchMessages()
  }, [page, activeType])

  const markAsRead = async (id: number) => {}

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-5 h-5 text-pink-500" />
      case 'COMMENT':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5 text-green-500" />
      case 'SYSTEM':
        return <Globe className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((msg) => (
          <Card key={msg.id} className={msg.status === 0 ? 'bg-blue-50' : ''}>
            <CardBody className="flex flex-row items-center gap-4">
              <Avatar src={msg.sender.avatar} name={msg.sender.name} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(msg.type)}
                  <span className="font-semibold">{msg.sender.name}</span>
                </div>
                <p className="text-gray-600">{msg.content}</p>
                <span className="text-sm text-gray-400">
                  {formatDistanceToNow(msg.created)}
                </span>
              </div>
              {msg.status === 0 && (
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => markAsRead(msg.id)}
                >
                  Mark as read
                </Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <Pagination
          total={totalPages}
          initialPage={1}
          page={page}
          onChange={setPage}
        />
      </div>
    </div>
  )
}
