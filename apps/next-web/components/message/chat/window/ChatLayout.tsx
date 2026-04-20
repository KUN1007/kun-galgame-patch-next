'use client'

import { Card, CardFooter } from '@heroui/card'
import type { ReactNode } from 'react'

interface ChatLayoutProps {
  header: ReactNode
  messageList: ReactNode
  replyBanner: ReactNode | null
  input: ReactNode
  modal: ReactNode
}

export const ChatLayout = ({
  header,
  messageList,
  replyBanner,
  input,
  modal
}: ChatLayoutProps) => {
  return (
    <Card className="flex flex-col h-full h-[42rem]">
      {header}
      {messageList}
      <CardFooter className="shrink-0 flex-col">
        {replyBanner}
        {input}
      </CardFooter>
      {modal}
    </Card>
  )
}
