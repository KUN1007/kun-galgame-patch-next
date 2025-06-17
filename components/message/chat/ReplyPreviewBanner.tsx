'use client'

import { X } from 'lucide-react'
import { Button } from '@heroui/react'
import type { QuoteMessage } from '~/types/api/chat'

interface Props {
  message: QuoteMessage
  onClose: () => void
}

export const ReplyPreviewBanner = ({ message, onClose }: Props) => {
  return (
    <div className="flex items-center justify-between w-full p-2 mb-2 bg-default-100 rounded-lg animate-in fade-in-50 slide-in-from-bottom-2">
      <div className="flex flex-col text-sm border-l-2 border-primary pl-3">
        <span className="font-semibold text-primary">
          回复给 {message.senderName}
        </span>
        <p className="line-clamp-1 opacity-80">{message.content}</p>
      </div>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={onClose}
        aria-label="Cancel reply"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
