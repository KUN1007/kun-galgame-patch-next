'use client'

import {
  Avatar,
  Accordion,
  AccordionItem,
  Card,
  CardBody,
  Divider
} from '@heroui/react'
import { MessageNav } from '~/components/message/MessageNav'
import { ChatRoomList } from '~/components/message/chat/ChatRoomList'
import './chat/message.css'

export const MessageSidebar = () => {
  const itemClasses = {
    base: 'p-2 w-full',
    heading: '',
    title: 'font-normal text-sm',
    subtitle: 'text-xs',
    trigger:
      'cursor-pointer px-2 py-1.5 data-[hover=true]:bg-default-100 rounded-lg h-14 flex items-center',
    indicator: 'text-medium',
    content: 'text-small px-0 py-4'
  }

  return (
    <Card className="h-full my-4">
      <CardBody className="p-0">
        <div className="flex flex-col h-full kun-list">
          <Accordion disableAnimation itemClasses={itemClasses}>
            <AccordionItem
              key="1"
              aria-label="网站通知消息"
              startContent={
                <Avatar color="primary" radius="full" src="/favicon.webp" />
              }
              title="网站通知消息"
              subtitle="点击以查看 补丁更新 等重要消息"
            >
              <MessageNav />
            </AccordionItem>
          </Accordion>

          <Divider />

          <ChatRoomList />
        </div>
      </CardBody>
    </Card>
  )
}
