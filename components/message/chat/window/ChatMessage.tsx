'use client'

import {
  Avatar,
  Button,
  Chip,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  useDisclosure
} from '@heroui/react'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { cn } from '~/utils/cn'
import { useSocket } from '~/context/SocketProvider'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import { useContextMenu } from '~/hooks/useContextMenu'
import { ChatMessageContextMenu } from './ChatMessageContextMenu'
import { useIsMobile } from '~/hooks/useIsMobile'
import { ReplyQuote } from './ReplyQuote'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import DOMPurify from 'isomorphic-dompurify'
import type {
  ChatMessage as ChatMessageType,
  ChatMessageReaction
} from '~/types/api/chat'

interface Props {
  message: ChatMessageType
  isOwnMessage: boolean
  isGroupChat: boolean
  onReply: () => void
  onEdit: () => void
}

export const ChatMessage = ({
  message,
  isOwnMessage,
  isGroupChat,
  onReply,
  onEdit
}: Props) => {
  const { socket } = useSocket()
  const { anchorPoint, isMenuOpen, handleContextMenu, setIsMenuOpen } =
    useContextMenu()
  const isMobile = useIsMobile()
  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete
  } = useDisclosure()

  const reactionGroups = useMemo(() => {
    if (!message.reaction || message.reaction.length < 3) {
      return null
    }
    return message.reaction.reduce<Record<string, number>>((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1
      return acc
    }, {})
  }, [message.reaction])

  const handleMessageClick = (event: React.MouseEvent) => {
    if (isMobile) {
      handleContextMenu(event)
    }
  }

  const handleJumpToMessage = (messageId: number) => {
    const element = document.getElementById(`message-${messageId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('highlight')
      setTimeout(() => {
        element.classList.remove('highlight')
      }, 1500)
    }
  }

  const handleDelete = () => {
    if (!socket || !message) {
      return
    }
    socket.emit(KUN_CHAT_EVENT.DELETE_MESSAGE, { messageId: message.id })
  }

  const handleReaction = (emoji: string) => {
    if (!socket || !message) {
      return
    }
    socket.emit(KUN_CHAT_EVENT.TOGGLE_REACTION, {
      messageId: message.id,
      emoji
    })
  }

  const alignment = isOwnMessage ? 'justify-end' : 'justify-start'
  const bubbleColor = isOwnMessage ? 'bg-primary/10' : 'bg-default-100'

  if (message.status === 'DELETED') {
    return (
      <div className="flex justify-center my-1">
        <Chip size="sm" variant="flat">
          {isOwnMessage ? '您' : `"${message.sender.name}"`} 删除了一条消息
        </Chip>
      </div>
    )
  }

  return (
    <>
      <div
        id={`message-${message.id}`}
        className={cn(
          'message-item',
          'flex items-end gap-2 group rounded-lg p-2',
          alignment
        )}
      >
        {!isOwnMessage && (
          <KunAvatar
            uid={message.sender.id}
            avatarProps={{
              radius: 'full',
              size: 'sm',
              name: message.sender.name,
              src: message.sender.avatar,
              className: 'shrink-0'
            }}
          />
        )}

        <div
          className={cn(
            'flex flex-col max-w-[70%]',
            isOwnMessage ? 'items-end' : 'items-start'
          )}
        >
          <div
            onContextMenu={!isMobile ? handleContextMenu : undefined}
            onClick={isMobile ? handleMessageClick : undefined}
            className={cn('relative p-3 pt-2 rounded-xl text-sm', bubbleColor)}
          >
            <span className="text-primary">{message.sender.name}</span>

            {message.quoteMessage && (
              <ReplyQuote
                message={message.quoteMessage}
                onJumpTo={() => handleJumpToMessage(message.reply_to_id!)}
              />
            )}

            <div className="flex flex-wrap items-end gap-2">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(message.content)
                }}
                className="kun-prose-message"
              />

              <div className="ml-auto whitespace-nowrap text-xs text-default-400 translate-y-[4px]">
                {message.status === 'EDITED' && '已编辑 '}
                {format(new Date(message.created), 'HH:mm')}
              </div>
            </div>
          </div>

          {message.reaction && message.reaction.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              {message.reaction.length < 3
                ? message.reaction.map((r: ChatMessageReaction) => (
                    <Chip
                      key={r.id}
                      size="sm"
                      variant="flat"
                      className="cursor-pointer"
                      onClick={() => handleReaction(r.emoji)}
                      classNames={{ content: 'flex gap-1 px-0' }}
                    >
                      <span>{r.emoji}</span>
                      <Avatar
                        src={r.user.avatar}
                        alt={r.user.name?.charAt(0).toUpperCase()}
                        className="size-4 shrink-0"
                      />
                    </Chip>
                  ))
                : reactionGroups &&
                  Object.entries(reactionGroups).map(([emoji, count]) => (
                    <Chip
                      key={emoji}
                      size="sm"
                      variant="flat"
                      className="cursor-pointer"
                      onClick={() => handleReaction(emoji)}
                    >
                      {emoji} {count}
                    </Chip>
                  ))}
            </div>
          )}
        </div>

        {isOwnMessage && (
          <KunAvatar
            uid={message.sender.id}
            avatarProps={{
              radius: 'full',
              size: 'sm',
              name: message.sender.name,
              src: message.sender.avatar,
              className: 'shrink-0'
            }}
          />
        )}
      </div>

      <ChatMessageContextMenu
        isMenuOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorPoint={anchorPoint}
        onReaction={handleReaction}
        reactionArray={message.reaction}
        onDelete={onOpenDelete}
        onReply={onReply}
        onEdit={onEdit}
        isOwner={isOwnMessage}
      />

      <Modal isOpen={isOpenDelete} onClose={onCloseDelete}>
        <ModalContent>
          <ModalHeader className="flex-col space-y-2">
            <h3 className="text-lg">删除消息</h3>
            <p className="text-sm font-medium text-default-500">
              您的消息将会被永久删除, 所有人不可见, 不可恢复, 并且会留下一条
              “某萝莉删除了一条消息” 的记录
            </p>
          </ModalHeader>
          <ModalFooter>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="light" onPress={onCloseDelete}>
                取消
              </Button>
              <Button color="danger" onPress={handleDelete}>
                删除
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
