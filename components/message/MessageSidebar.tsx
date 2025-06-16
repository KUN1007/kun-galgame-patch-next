'use client'

import { MessageNav } from '~/components/message/MessageNav'
import { ChatRoomList } from '~/components/message/ChatRoomList'
import { Card, CardBody, Tab, Tabs } from '@heroui/react'
import { Bell, MessageSquare } from 'lucide-react'

export const MessageSidebar = () => {
  return (
    <Card className="h-full">
      <CardBody className="p-0">
        <Tabs
          aria-label="消息类型"
          fullWidth
          classNames={{
            panel: 'h-full p-0',
            base: 'h-full',
            tabList: 'rounded-t-lg'
          }}
        >
          <Tab
            key="notifications"
            title={
              <div className="flex items-center space-x-2">
                <Bell size={16} />
                <span>通知</span>
              </div>
            }
          >
            <div className="p-2">
              <MessageNav />
            </div>
          </Tab>
          <Tab
            key="chats"
            title={
              <div className="flex items-center space-x-2">
                <MessageSquare size={16} />
                <span>聊天</span>
              </div>
            }
          >
            <ChatRoomList />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  )
}
