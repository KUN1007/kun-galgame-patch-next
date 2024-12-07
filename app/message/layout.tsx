import { MessageNav } from '~/components/message/MessageNav'
import { KunHeader } from '~/components/kun/Header'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function MessageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto my-4">
      <KunHeader
        name="消息"
        description="这是消息页面, 第一次访问对应的页面会自动已读所有消息"
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        <MessageNav />
        <div className="w-full lg:w-3/4">{children}</div>
      </div>
    </div>
  )
}
