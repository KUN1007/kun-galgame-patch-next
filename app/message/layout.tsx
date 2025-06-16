import { MessageSidebar } from '~/components/message/MessageSidebar'
import { SocketProvider } from '~/context/SocketProvider'
import { KunHeader } from '~/components/kun/Header'
import { kunMetadata } from './metadata'
import { kunGetUserInfoActions } from './actions'
import { Alert } from '@heroui/alert'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function MessageLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await kunGetUserInfoActions()

  return typeof user === 'string' ? (
    <Alert color="danger" title="请登录后查看消息页面" />
  ) : (
    <SocketProvider userId={user.uid}>
      <div className="container mx-auto my-4">
        <KunHeader
          name="消息中心"
          description="您可以在这里查看系统通知与私聊"
        />
        <div className="flex h-[calc(100vh-12rem)] min-h-[500px] gap-6">
          <div className="hidden w-1/3 lg:flex lg:flex-col">
            <MessageSidebar />
          </div>

          <div className="w-full lg:w-2/3">{children}</div>
        </div>
      </div>
    </SocketProvider>
  )
}
