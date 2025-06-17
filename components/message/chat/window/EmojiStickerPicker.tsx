'use client'

import { ScrollShadow, Tabs, Tab } from '@heroui/react'
import { emojiArray } from '~/constants/emoji'
import { generateStickerArray } from '~/utils/generateStickerArray'

interface EmojiStickerPickerProps {
  onEmojiSelect: (emoji: string) => void
  onStickerSend: (stickerUrl: string) => void
}

const stickers = generateStickerArray()

export const EmojiStickerPicker = ({
  onEmojiSelect,
  onStickerSend
}: EmojiStickerPickerProps) => {
  return (
    <Tabs aria-label="表情与贴纸" fullWidth>
      <Tab key="emoji" title="表情">
        <ScrollShadow hideScrollBar visibility="none" className="h-48">
          <div className="grid grid-cols-8 gap-2 p-2">
            {emojiArray.map((emoji, index) => (
              <button
                key={index}
                className="text-xl shrink-0 hover:bg-default-200 rounded-md p-1 transition-colors"
                onClick={() => onEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </ScrollShadow>
      </Tab>
      <Tab key="stickers" title="贴纸">
        <ScrollShadow visibility="none" className="h-48">
          <div className="grid grid-cols-5 gap-2 p-2">
            {stickers.map((url) => (
              <button
                key={url}
                className="hover:bg-default-200 rounded-md p-1 transition-colors"
                onClick={() => onStickerSend(url)}
              >
                <img
                  src={url}
                  alt="sticker"
                  width="64"
                  height="64"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </ScrollShadow>
      </Tab>
    </Tabs>
  )
}
