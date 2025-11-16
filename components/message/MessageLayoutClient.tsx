'use client'

import { usePathname } from 'next/navigation'
import { cn } from '~/utils/cn'
import { KunHeader } from '../kun/Header'
import type { ReactNode } from 'react'

interface Props {
  sidebar: ReactNode
  children: ReactNode
}

export const MessageLayoutClient = ({ sidebar, children }: Props) => {
  const pathname = usePathname()

  const isChatPage = pathname === '/message/chat'

  return (
    <div className="flex flex-col md:flex-row min-h-[500px] gap-6">
      <div
        className={cn(
          'transition-all duration-300 md:block md:fixed md:top-32 md:w-64',
          isChatPage ? 'block w-full' : 'hidden'
        )}
      >
        <KunHeader
          name="消息中心"
          description="您可以在这里查看系统通知与私聊"
        />

        {sidebar}
      </div>

      <div
        className={cn(
          'flex-1 transition-all duration-300',
          'md:block md:pl-68',
          isChatPage ? '' : 'block'
        )}
      >
        {children}
      </div>
    </div>
  )
}
