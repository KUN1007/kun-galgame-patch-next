import { KunHeader } from '~/components/kun/Header'
import { kunMetadata } from './metadata'
import { kunGetUserInfoActions } from './actions'
import { Alert } from '@heroui/alert'
import { SocketProvider } from '~/context/SocketProvider'
import { MessageLayoutClient } from '~/components/message/MessageLayoutClient'
import { MessageSidebar } from '~/components/message/MessageSidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function MessageLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await kunGetUserInfoActions()

  if (typeof user === 'string') {
    return <Alert color="danger" title="请登录后查看消息页面" />
  }

  return (
    <SocketProvider userId={user.uid}>
      <div className="container mx-auto my-4">
        <MessageLayoutClient sidebar={<MessageSidebar />}>
          {children}
        </MessageLayoutClient>
      </div>
    </SocketProvider>
  )
}
