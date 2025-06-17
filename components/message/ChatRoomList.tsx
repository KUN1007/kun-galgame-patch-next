'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSocket } from '~/context/SocketProvider'
import { kunFetchGet } from '~/utils/kunFetch'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import toast from 'react-hot-toast'
import { Avatar, Listbox, ListboxItem, ScrollShadow } from '@heroui/react'
import { User, Users } from 'lucide-react'
import { KunLoading } from '~/components/kun/Loading'
import type {
  ChatMessage,
  GetChatroomResponse,
  ChatRoomWithLatestMessage
} from '~/types/api/chat'

export const ChatRoomList = () => {
  const [rooms, setRooms] = useState<ChatRoomWithLatestMessage[]>([])
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()
  const pathname = usePathname()

  const activeLink = useMemo(() => {
    return pathname.split('/').pop() || ''
  }, [pathname])

  useEffect(() => {
    const fetchChatRooms = async () => {
      setLoading(true)
      try {
        const response =
          await kunFetchGet<KunResponse<GetChatroomResponse[]>>('/chat-room')
        if (typeof response !== 'string') {
          setRooms(response)
        } else {
          toast.error(response)
        }
      } catch (error) {
        toast.error('无法加载聊天列表')
      } finally {
        setLoading(false)
      }
    }
    fetchChatRooms()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (newMessage: ChatMessage) => {
      setRooms((prevRooms) => {
        const newRooms = [...prevRooms]
        const roomIndex = newRooms.findIndex(
          (r) => r.id === newMessage.chat_room_id
        )

        if (roomIndex !== -1) {
          const updatedRoom = {
            ...newRooms[roomIndex],
            message: [newMessage],
            last_message_time: newMessage.created
          }
          newRooms.splice(roomIndex, 1)
          newRooms.unshift(updatedRoom)
          return newRooms
        }
        return prevRooms
      })
    }

    socket.on(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleNewMessage)
    return () => {
      socket.off(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleNewMessage)
    }
  }, [socket])

  const getDescription = useCallback((room: ChatRoomWithLatestMessage) => {
    const lastMessage = room.message[0]

    if (!lastMessage) {
      return '暂无消息'
    }

    return lastMessage.status === 'DELETED'
      ? `${lastMessage.sender.name} 删除了一条消息`
      : lastMessage.content
  }, [])

  return (
    <ScrollShadow hideScrollBar className="flex-grow p-2">
      {loading ? (
        <KunLoading hint="正在加载聊天中..." />
      ) : (
        <Listbox
          aria-label="聊天室列表"
          variant="flat"
          selectionMode="single"
          selectedKeys={new Set([activeLink])}
        >
          {rooms.map((room) => {
            const Icon = room.type === 'PRIVATE' ? User : Users

            return (
              <ListboxItem
                key={room.link}
                href={`/message/chat/${room.link}`}
                startContent={
                  <Avatar
                    className="shrink-0"
                    src={room.avatar}
                    name={room.name}
                  />
                }
                endContent={<Icon className="text-default-400" />}
                description={getDescription(room)}
                textValue={room.name}
              >
                {room.name}
              </ListboxItem>
            )
          })}
        </Listbox>
      )}
    </ScrollShadow>
  )
}
