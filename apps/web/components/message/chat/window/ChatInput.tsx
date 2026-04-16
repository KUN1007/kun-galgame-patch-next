'use client'

import { useRef } from 'react'
import { Textarea } from '@heroui/input'
import { Button } from '@heroui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/react'
import { SendHorizontal, Smile } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { EmojiStickerPicker } from './EmojiStickerPicker'

interface ChatInputProps {
  inputValue: string
  onValueChange: (value: string) => void
  onSendMessage: () => void
  onStickerSend: (url: string) => void
  isConnected: boolean
}

export const ChatInput = ({
  inputValue,
  onValueChange,
  onSendMessage,
  onStickerSend,
  isConnected
}: ChatInputProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useHotkeys(
    'ctrl+enter, cmd+enter',
    (event) => {
      event.preventDefault()
      onSendMessage()
    },
    { enableOnFormTags: true }
  )

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textAreaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue =
      inputValue.substring(0, start) + emoji + inputValue.substring(end)
    onValueChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
    }, 0)
  }

  return (
    <div className="flex w-full items-end gap-2">
      <Popover placement="top-start">
        <PopoverTrigger>
          <Button isIconOnly variant="light" aria-label="表情与贴纸">
            <Smile />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-2">
          <EmojiStickerPicker
            onEmojiSelect={handleEmojiSelect}
            onStickerSend={onStickerSend}
          />
        </PopoverContent>
      </Popover>

      <Textarea
        ref={textAreaRef}
        minRows={1}
        placeholder={
          isConnected ? 'Ctrl + 回车发送消息, 支持 Markdown' : '正在连接...'
        }
        value={inputValue}
        onValueChange={onValueChange}
        disabled={!isConnected}
      />

      <Button
        isIconOnly
        color="primary"
        aria-label="发送消息"
        onPress={onSendMessage}
        disabled={!inputValue.trim()}
      >
        <SendHorizontal />
      </Button>
    </div>
  )
}
