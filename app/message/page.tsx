'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, Avatar, Button, Pagination } from '@nextui-org/react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { Bell, Heart, MessageCircle, UserPlus, Globe } from 'lucide-react'

interface Notification {
  id: number
  type: string
  content: string
  status: number
  created: string
  linkId: number
  sender: {
    id: number
    name: string
    avatar: string
  }
}

const message = [
  {
    id: 1,
    type: 'message',
    content: 'You have a new message from Alice.',
    status: 0,
    created: '2024-11-21T10:15:00Z',
    sender: {
      id: 101,
      name: 'Alice',
      avatar: 'https://example.com/avatar/alice.png'
    }
  },
  {
    id: 2,
    type: 'system',
    content: 'Your password was successfully updated.',
    status: 1,
    created: '2024-11-20T18:30:00Z',
    sender: {
      id: 0,
      name: 'System',
      avatar: 'https://example.com/avatar/system.png'
    }
  },
  {
    id: 3,
    type: 'alert',
    content: 'Your account login was detected from a new device.',
    status: 0,
    created: '2024-11-19T22:45:00Z',
    sender: {
      id: 102,
      name: 'Security Team',
      avatar: 'https://example.com/avatar/security.png'
    }
  }
]

interface NotificationListProps {
  userId: number
}

export default function Kun({ userId }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(message)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeType, setActiveType] = useState<string | null>(null)

  // const fetchNotifications = async () => {
  //   try {
  //     const params = new URLSearchParams({
  //       userId: userId.toString(),
  //       page: page.toString(),
  //       ...(activeType && { type: activeType })
  //     })

  //     const response = await fetch(`/api/notifications?${params}`)
  //     const data = await response.json()

  //     setNotifications(data.notifications)
  //     setTotalPages(data.pagination.totalPages)
  //   } catch (error) {
  //     console.error('Error fetching notifications:', error)
  //   }
  // }

  // useEffect(() => {
  //   fetchNotifications()
  // }, [page, activeType])

  // const markAsRead = async (id: number) => {
  //   try {
  //     await fetch(`/api/notifications?id=${id}`, {
  //       method: 'PATCH'
  //     })
  //     fetchNotifications()
  //   } catch (error) {
  //     console.error('Error marking notification as read:', error)
  //   }
  // }

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
    <div className="max-w-4xl p-4 mx-auto space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          color={activeType === null ? 'primary' : 'default'}
          onClick={() => setActiveType(null)}
        >
          All
        </Button>
        <Button
          color={activeType === 'LIKE' ? 'primary' : 'default'}
          onClick={() => setActiveType('LIKE')}
        >
          Likes
        </Button>
        <Button
          color={activeType === 'COMMENT' ? 'primary' : 'default'}
          onClick={() => setActiveType('COMMENT')}
        >
          Comments
        </Button>
        <Button
          color={activeType === 'FOLLOW' ? 'primary' : 'default'}
          onClick={() => setActiveType('FOLLOW')}
        >
          Follows
        </Button>
        <Button
          color={activeType === 'SYSTEM' ? 'primary' : 'default'}
          onClick={() => setActiveType('SYSTEM')}
        >
          System
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={notification.status === 0 ? 'bg-blue-50' : ''}
          >
            <CardBody className="flex flex-row items-center gap-4">
              <Avatar
                src={notification.sender.avatar}
                name={notification.sender.name}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(notification.type)}
                  <span className="font-semibold">
                    {notification.sender.name}
                  </span>
                </div>
                <p className="text-gray-600">{notification.content}</p>
                <span className="text-sm text-gray-400">
                  {formatDistanceToNow(notification.created)}
                </span>
              </div>
              {notification.status === 0 && (
                <Button
                  size="sm"
                  variant="light"
                  // onClick={() => markAsRead(notification.id)}
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
