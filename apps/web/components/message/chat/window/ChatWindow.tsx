'use client'

import { useState, useCallback, useMemo } from 'react'
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
import { ChatLayout } from './ChatLayout'
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

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !socket) return
    socket.emit(KUN_CHAT_EVENT.SEND_MESSAGE, {
      roomId: chatroom.id,
      content: inputValue,
      replyToId: replyingTo?.id
    })
    setInputValue('')
    setReplyingTo(null)
  }, [socket, chatroom.id, inputValue, replyingTo])

  const handleStickerSend = useCallback(
    (stickerUrl: string) => {
      if (!socket) return
      const content = `![sticker](${stickerUrl})`
      socket.emit(KUN_CHAT_EVENT.SEND_MESSAGE, {
        roomId: chatroom.id,
        content,
        replyToId: replyingTo?.id
      })
      setReplyingTo(null)
    },
    [socket, chatroom.id, replyingTo]
  )

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
  })

  const handleReply = useCallback((message: ChatMessageType) => {
    setReplyingTo(message)
  }, [])
  const handleEdit = useCallback(
    (message: ChatMessageType) => {
      setEditingMessage(message)
      onEditModalOpen()
    },
    [onEditModalOpen]
  )

  // separate the state between MessageList and ChatInput, avoid MessageList too-many rerender, !important
  const header = useMemo(
    () => (
      <ChatHeader
        chatroom={chatroom}
        onlineCount={onlineCount}
        typingUsers={typingUsers}
      />
    ),
    [chatroom, onlineCount, typingUsers]
  )

  const messageList = useMemo(
    () => (
      <MessageList
        messages={messages}
        chatroom={chatroom}
        currentUserId={currentUserId}
        isLoadingHistory={isLoadingHistory}
        scrollRef={scrollRef}
        scrollHeightBeforeUpdate={scrollHeightBeforeUpdate}
        onReply={handleReply}
        onEdit={handleEdit}
      />
    ),
    [
      messages,
      chatroom,
      currentUserId,
      isLoadingHistory,
      scrollRef,
      scrollHeightBeforeUpdate,
      handleReply,
      handleEdit
    ]
  )

  const replyBanner = useMemo(() => {
    if (!replyingTo) return null
    return (
      <ReplyPreviewBanner
        message={{
          content: replyingTo.content,
          senderName: replyingTo.sender.name
        }}
        onClose={() => setReplyingTo(null)}
      />
    )
  }, [replyingTo])

  const modal = useMemo(
    () => (
      <EditMessageModal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
        onSave={handleSaveEdit}
      />
    ),
    [isEditModalOpen, onEditModalClose, editingMessage, handleSaveEdit]
  )

  const input = (
    <ChatInput
      inputValue={inputValue}
      onValueChange={setInputValue}
      onSendMessage={handleSendMessage}
      onStickerSend={handleStickerSend}
      isConnected={isConnected}
    />
  )

  return (
    <ChatLayout
      header={header}
      messageList={messageList}
      replyBanner={replyBanner}
      input={input}
      modal={modal}
    />
  )
}
