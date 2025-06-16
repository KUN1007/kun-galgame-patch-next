'use client'

import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownTrigger
} from '@heroui/react'
import { CornerDownRight, Trash2, Edit } from 'lucide-react'

interface Props {
  isMenuOpen: boolean
  onClose: () => void
  anchorPoint: { x: number; y: number }
  onReaction: (emoji: string) => void
  onDelete?: () => void
  isOwner?: boolean
}

const commonReactions = ['🥰', '👍', '❤️', '🤨', '🙄']

export const ChatMessageContextMenu = ({
  isMenuOpen,
  onClose,
  anchorPoint,
  onReaction,
  onDelete,
  isOwner = false
}: Props) => {
  if (!isMenuOpen) return null

  const performAction = (action?: () => void) => {
    if (action) {
      action()
    }
    onClose()
  }

  return (
    <div style={{ position: 'fixed', top: anchorPoint.y, left: anchorPoint.x }}>
      <Dropdown isOpen={isMenuOpen} onOpenChange={onClose}>
        <DropdownTrigger>
          <div />
        </DropdownTrigger>
        <DropdownMenu aria-label="Message Actions">
          <DropdownItem
            textValue="表情"
            isReadOnly
            key="reactions"
            className="gap-1 cursor-default data-[hover=true]:bg-background"
          >
            {commonReactions.map((emoji) => (
              <span
                key={emoji}
                className="cursor-pointer p-1 rounded-full text-lg hover:bg-default-200"
                onClick={() => onReaction(emoji)}
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
              onClick={() => performAction(onDelete)}
            >
              删除
            </DropdownItem>
          ) : null}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
