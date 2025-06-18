'use client'

import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownTrigger,
  Tooltip,
  Avatar,
  DropdownSection
} from '@heroui/react'
import { CornerDownRight, Trash2, Edit } from 'lucide-react'
import { useMemo, type Key } from 'react'
// import { formatDate } from '~/utils/time'
import type { ChatMessageReaction } from '~/types/api/chat'

interface Props {
  isMenuOpen: boolean
  onClose: () => void
  anchorPoint: { x: number; y: number }
  onReaction: (emoji: string) => void
  reactionArray: ChatMessageReaction[]
  onDelete?: () => void
  onReply?: () => void
  onEdit?: () => void
  isOwner?: boolean
}

const commonReactions = [
  '🥰',
  '👍',
  '❤️',
  '🤨',
  '🙄',
  '😎',
  '😱',
  '😭',
  '🔥',
  '🎉'
]

export const ChatMessageContextMenu = ({
  isMenuOpen,
  onClose,
  anchorPoint,
  onReaction,
  reactionArray,
  onDelete,
  onReply,
  onEdit,
  isOwner = false
}: Props) => {
  if (!isMenuOpen) return null

  const groupedReactions = useMemo(() => {
    if (!reactionArray || reactionArray.length === 0) {
      return {}
    }
    return reactionArray.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = []
        }
        acc[reaction.emoji].push(reaction)
        return acc
      },
      {} as Record<string, ChatMessageReaction[]>
    )
  }, [reactionArray])

  const handleMenuAction = (key: Key) => {
    switch (key) {
      case 'reply':
        onReply?.()
        break
      case 'edit':
        onEdit?.()
        break
      case 'delete':
        onDelete?.()
        break
    }
    onClose()
  }

  const handleReactionClick = (emoji: string) => {
    onReaction(emoji)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', top: anchorPoint.y, left: anchorPoint.x }}>
      <Dropdown isOpen={isMenuOpen} onOpenChange={onClose}>
        <DropdownTrigger>
          <div />
        </DropdownTrigger>
        <DropdownMenu aria-label="Message Actions" onAction={handleMenuAction}>
          <DropdownItem
            textValue="Reactions"
            isReadOnly
            key="reactions"
            className="gap-1 px-0 cursor-default data-[hover=true]:bg-background"
          >
            <div className="grid grid-cols-5">
              {commonReactions.map((emoji) => (
                <span
                  key={emoji}
                  className="cursor-pointer p-1 flex justify-center items-center rounded-full text-lg hover:bg-default-200"
                  onClick={() => handleReactionClick(emoji)}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </DropdownItem>

          <DropdownSection showDivider title="消息操作">
            <DropdownItem
              key="reply"
              startContent={<CornerDownRight className="size-4" />}
            >
              回复
            </DropdownItem>

            {isOwner ? (
              <DropdownItem
                key="edit"
                startContent={<Edit className="size-4" />}
              >
                编辑
              </DropdownItem>
            ) : null}

            {isOwner ? (
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Trash2 className="size-4" />}
              >
                删除
              </DropdownItem>
            ) : null}
          </DropdownSection>

          <DropdownSection title="回应表情">
            <>
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <DropdownItem
                  key={`reaction-detail-${emoji}`}
                  isReadOnly
                  startContent={<span className="text-xs">{emoji}</span>}
                  endContent={
                    <span className="text-xs text-default-600">
                      {reactions.length}
                    </span>
                  }
                  className="cursor-default data-[hover=true]:bg-background"
                  textValue={`${emoji} ${reactions.length}`}
                >
                  <span className="text-xs">{reactions[0].user.name}</span>
                  {reactions.length > 1 && (
                    <span className="text-xs text-default-500">
                      {' '}
                      等 {reactions.length - 1} 人
                    </span>
                  )}
                </DropdownItem>
              ))}
            </>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
