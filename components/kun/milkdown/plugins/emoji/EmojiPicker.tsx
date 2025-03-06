'use client'

import { editorViewCtx } from '@milkdown/core'
import { useState } from 'react'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip
} from '@nextui-org/react'
import { ChevronLeft, ChevronRight, SmilePlus } from 'lucide-react'
import { emojiArray } from './_isoEmoji'
import type { UseEditorReturn } from '@milkdown/react'

interface Props {
  editorInfo: UseEditorReturn
}

export const EmojiPicker = ({ editorInfo }: Props) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const emojisPerPage = 49
  const totalPages = Math.ceil(emojiArray.length / emojisPerPage)

  const paginatedEmojis = (() => {
    const start = (currentPage - 1) * emojisPerPage
    return emojiArray.slice(start, start + emojisPerPage)
  })()

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const onSelectEmoji = (emoji: string) => {
    editorInfo.get()?.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const { state } = view
      const { tr } = state
      view.dispatch(tr.insertText(emoji, state.selection.from))
    })
  }

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom"
      offset={10}
    >
      <PopoverTrigger>
        <Button isIconOnly variant="light">
          <Tooltip content="插入表情" offset={16}>
            <SmilePlus className="size-6" />
          </Tooltip>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px]">
        <div className="grid grid-cols-7 gap-1 mt-2">
          {paginatedEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onSelectEmoji(emoji)}
              className="p-1 text-lg transition-colors rounded cursor-pointer hover:bg-primary/20"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={prevPage}
            isDisabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={nextPage}
            isDisabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
