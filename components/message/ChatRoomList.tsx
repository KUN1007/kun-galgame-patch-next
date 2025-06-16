'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSocket } from '~/context/SocketProvider'
import { kunFetchGet } from '~/utils/kunFetch'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import toast from 'react-hot-toast'
import type {
  ChatRoomsApiResponse,
  ChatRoomWithDetails
} from '~/types/api/chat'
import {
  Avatar,
  Button,
  Listbox,
  ListboxItem,
  ScrollShadow,
  Skeleton
} from '@heroui/react'
import { Plus, User, Users } from 'lucide-react'
import Link from 'next/link'
import { CreateGroupChatModal } from './CreateGroupChatModal'
import { useDisclosure } from '@heroui/react'
import { KunLoading } from '~/components/kun/Loading'
import type { GetChatroomResponse } from '~/types/api/chat'

export const ChatRoomList = () => {
  const [rooms, setRooms] = useState<ChatRoomWithDetails[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const { socket } = useSocket()

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

    const handleNewMessage = (newMessage: any) => {
      setRooms((prevRooms) => {
        return prevRooms
          .map((room) => {
            if (room.id === newMessage.chat_room_id) {
              return {
                ...room,
                message: [newMessage],
                last_message_time: newMessage.created
              }
            }
            return room
          })
          .sort(
            (a, b) =>
              new Date(b.last_message_time).getTime() -
              new Date(a.last_message_time).getTime()
          )
      })
    }

    socket.on(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleNewMessage)

    return () => {
      socket.off(KUN_CHAT_EVENT.RECEIVE_MESSAGE, handleNewMessage)
    }
  }, [socket])

  const activeLink = pathname.split('/').pop() || ''

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Button
          fullWidth
          color="primary"
          variant="flat"
          startContent={<Plus size={16} />}
          onPress={onOpen}
        >
          创建或加入群聊
        </Button>

        <CreateGroupChatModal isOpen={isOpen} onClose={onClose} />
      </div>
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
              const lastMessage = room.message[0]
              // TODO: room name and avatar
              const title = room.type === 'PRIVATE' ? room.name : room.name
              const Icon = room.type === 'PRIVATE' ? User : Users

              return (
                <ListboxItem
                  key={room.link}
                  href={`/message/chat/${room.link}`}
                  startContent={<Avatar src={room.avatar} name={title} />}
                  endContent={<Icon size={16} className="text-default-400" />}
                  description={
                    lastMessage
                      ? `${lastMessage.sender.name}: ${lastMessage.content}`
                      : '暂无消息'
                  }
                  textValue={title ?? ''}
                >
                  {title}
                </ListboxItem>
              )
            })}
          </Listbox>
        )}
      </ScrollShadow>
    </div>
  )
}
