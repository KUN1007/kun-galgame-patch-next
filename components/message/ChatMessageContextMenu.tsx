'use client'

import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownTrigger
} from '@heroui/react'
import { CornerDownRight, Trash2, Edit } from 'lucide-react'
import type { Key } from 'react'

interface Props {
  isMenuOpen: boolean
  onClose: () => void
  anchorPoint: { x: number; y: number }
  onReaction: (emoji: string) => void
  onDelete?: () => void
  onReply?: () => void
  onEdit?: () => void
  isOwner?: boolean
}

const commonReactions = ['🥰', '👍', '❤️', '🤨', '🙄']

export const ChatMessageContextMenu = ({
  isMenuOpen,
  onClose,
  anchorPoint,
  onReaction,
  onDelete,
  onReply,
  onEdit,
  isOwner = false
}: Props) => {
  if (!isMenuOpen) return null

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
            className="gap-1 cursor-default data-[hover=true]:bg-background"
          >
            {commonReactions.map((emoji) => (
              <span
                key={emoji}
                className="cursor-pointer p-1 rounded-full text-lg hover:bg-default-200"
                onClick={() => handleReactionClick(emoji)}
              >
                {emoji}
              </span>
            ))}
          </DropdownItem>

          <DropdownItem
            key="reply"
            startContent={<CornerDownRight className="size-4" />}
          >
            回复
          </DropdownItem>

          {isOwner ? (
            <DropdownItem key="edit" startContent={<Edit className="size-4" />}>
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
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
