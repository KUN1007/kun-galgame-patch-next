'use client'

import { Avatar } from '@heroui/avatar'
import { Chip } from '@heroui/chip'
import { format } from 'date-fns'
import { cn } from '~/utils/cn'
import { useSocket } from '~/context/SocketProvider'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import { useContextMenu } from '~/hooks/useContextMenu'
import { ChatMessageContextMenu } from './ChatMessageContextMenu'
import { useIsMobile } from '~/hooks/useIsMobile'
import type { ChatMessage as ChatMessageType } from '~/types/api/chat'

interface Props {
  message: ChatMessageType
  isOwnMessage: boolean
  isGroupChat: boolean
}

export const ChatMessage = ({ message, isOwnMessage, isGroupChat }: Props) => {
  const { socket } = useSocket()
  const { anchorPoint, isMenuOpen, handleContextMenu, setIsMenuOpen } =
    useContextMenu()
  const isMobile = useIsMobile()

  const handleMessageClick = (event: React.MouseEvent) => {
    if (isMobile) {
      handleContextMenu(event)
    }
  }

  const handleDelete = () => {
    if (!socket || !message) return
    socket.emit(KUN_CHAT_EVENT.DELETE_MESSAGE, { messageId: message.id })
  }

  const handleReaction = (emoji: string) => {
    if (!socket || !message) return
    socket.emit(KUN_CHAT_EVENT.ADD_REACTION, { messageId: message.id, emoji })
  }

  const alignment = isOwnMessage ? 'justify-end' : 'justify-start'
  const bubbleColor = isOwnMessage
    ? 'bg-primary text-primary-foreground'
    : 'bg-default-100'

  if (message.status === 'DELETED') {
    return (
      <div className="flex justify-center my-1">
        <Chip size="sm" variant="flat">
          {isOwnMessage ? 'You' : `"${message.sender.name}"`} deleted a message
        </Chip>
      </div>
    )
  }

  return (
    <>
      <div className={cn('flex items-end gap-2 group', alignment)}>
        {!isOwnMessage && (
          <Avatar
            src={message.sender.avatar}
            size="sm"
            name={message.sender.name}
          />
        )}

        <div
          className={cn(
            'flex flex-col max-w-[70%]',
            isOwnMessage ? 'items-end' : 'items-start'
          )}
        >
          {isGroupChat && !isOwnMessage && (
            <span className="text-xs text-default-500 ml-2 mb-1">
              {message.sender.name}
            </span>
          )}

          <div
            onContextMenu={!isMobile ? handleContextMenu : undefined}
            onClick={isMobile ? handleMessageClick : undefined}
            className={cn('relative px-3 py-2 rounded-xl', bubbleColor)}
          >
            <p className="whitespace-pre-wrap break-words pr-12">
              {message.content}
            </p>

            <div className="absolute bottom-1 right-2 text-xs opacity-60">
              {message.status === 'EDITED' && 'edited '}
              {format(new Date(message.created), 'HH:mm')}
            </div>
          </div>

          {message.reaction && message.reaction.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 px-1">
              {message.reaction.map((r: any) => (
                <Chip
                  key={r.id}
                  size="sm"
                  variant="flat"
                  className="cursor-pointer"
                  onClick={() => handleReaction(r.emoji)}
                >
                  {r.emoji} {r._count?.id || 1}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {isOwnMessage && (
          <Avatar
            src={message.sender.avatar}
            size="sm"
            name={message.sender.name}
          />
        )}
      </div>

      <ChatMessageContextMenu
        isMenuOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorPoint={anchorPoint}
        onReaction={handleReaction}
        onDelete={handleDelete}
        isOwner={isOwnMessage}
      />
    </>
  )
}
