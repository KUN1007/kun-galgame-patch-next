'use client'

import { useState } from 'react'
import { MessageList } from './MessageList'
import { MessageNav } from './MessageNav'

export const MessageContainer = () => {
  const [activeType, setActiveType] = useState<string | null>(null)
  const userId = 1 // Example user ID

  return (
    <div className="container px-4 mx-auto">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar - Full width on mobile, 1/4 width on desktop */}
        <div className="w-full lg:w-1/4">
          <MessageNav activeType={activeType} onTypeChange={setActiveType} />
        </div>

        {/* Main content - Full width on mobile, 3/4 width on desktop */}
        <div className="w-full lg:w-3/4">
          <MessageList userId={userId} activeType={activeType} />
        </div>
      </div>
    </div>
  )
}
