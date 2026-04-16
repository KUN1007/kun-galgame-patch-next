'use client'

import DOMPurify from 'isomorphic-dompurify'
import type { QuoteMessage } from '~/types/api/chat'

interface Props {
  message: QuoteMessage
  onJumpTo: () => void
}

export const ReplyQuote = ({ message, onJumpTo }: Props) => {
  if (!message) return null

  return (
    <div
      onClick={onJumpTo}
      className="flex items-start gap-2 mb-1 cursor-pointer rounded-lg overflow-hidden"
    >
      <div className="flex w-full flex-col border-l-3 bg-secondary/10 px-2 py-1 border-secondary">
        <span className="text-secondary">{message.senderName}</span>

        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(message.content)
          }}
          className="kun-prose-message line-clamp-2 opacity-80"
        />
      </div>
    </div>
  )
}
