'use client'

import { useState } from 'react'
import { Card, CardFooter } from '@heroui/card'
import { useDisclosure } from '@heroui/react'
import { useDebouncedCallback } from 'use-debounce'
import { useSocket } from '~/context/SocketProvider'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import { useChatMessage } from '~/hooks/chat/useChatMessage'
import { useChatSocket } from '~/hooks/chat/useChatSocket'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { ReplyPreviewBanner } from './ReplyPreviewBanner'
import { EditMessageModal } from './EditMessageModal'
import type { ChatRoom, ChatMessage as ChatMessageType } from '~/types/api/chat'

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
  const [inputValue, setInputValue] = useState('')
  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessageType | null>(
    null
  )

  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose
  } = useDisclosure()
  const { socket } = useSocket()

  const {
    messages,
    setMessages,
    isLoadingHistory,
    scrollRef,
    scrollHeightBeforeUpdate
  } = useChatMessage(initialMessages, chatroom.link)

  const { isConnected, typingUsers, onlineCount } = useChatSocket({
    chatroomId: chatroom.id,
    setMessages,
    inputValue,
    currentUserId,
    scrollRef
  })

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

  const handleStickerSend = (stickerUrl: string) => {
    if (!socket) return
    const content = `![sticker](${stickerUrl})`
    socket.emit(KUN_CHAT_EVENT.SEND_MESSAGE, {
      roomId: chatroom.id,
      content,
      replyToId: replyingTo?.id
    })
    setReplyingTo(null)
  }

  const handleSaveEdit = useDebouncedCallback(() => {
    if (!socket || !editingMessage) return
    socket.emit(KUN_CHAT_EVENT.EDIT_MESSAGE, {
      messageId: editingMessage.id,
      newContent: editingMessage.contentMarkdown
    })
    setMessages((prev) =>
      prev.map((msg) => (msg.id === editingMessage.id ? editingMessage : msg))
    )
    setEditingMessage(null)
    onEditModalClose()
  }, 500)

  return (
    <Card className="flex flex-col h-full h-[48rem]">
      <ChatHeader
        chatroom={chatroom}
        onlineCount={onlineCount}
        typingUsers={typingUsers}
      />

      <MessageList
        messages={messages}
        chatroom={chatroom}
        currentUserId={currentUserId}
        isLoadingHistory={isLoadingHistory}
        scrollRef={scrollRef}
        scrollHeightBeforeUpdate={scrollHeightBeforeUpdate}
        onReply={setReplyingTo}
        onEdit={(msg) => {
          setEditingMessage(msg)
          onEditModalOpen()
        }}
      />

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
        <ChatInput
          inputValue={inputValue}
          onValueChange={setInputValue}
          onSendMessage={handleSendMessage}
          onStickerSend={handleStickerSend}
          isConnected={isConnected}
        />
      </CardFooter>

      <EditMessageModal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
        onSave={handleSaveEdit}
      />
    </Card>
  )
}
