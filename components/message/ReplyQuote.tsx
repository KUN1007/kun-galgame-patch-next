'use client'

import { MessageCircle } from 'lucide-react'
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
      className="flex items-start gap-2 p-2 mb-1 bg-black/10 rounded-lg cursor-pointer border-l-2 border-primary"
    >
      <MessageCircle className="size-4 shrink-0 text-primary mt-0.5" />
      <div className="flex flex-col text-sm">
        <span className="font-semibold text-primary">{message.senderName}</span>
        <p className="line-clamp-2 opacity-80">{message.content}</p>
      </div>
    </div>
  )
}
