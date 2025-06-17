'use client'

import { usePathname } from 'next/navigation'
import { cn } from '~/utils/cn'
import type { ReactNode } from 'react'

interface Props {
  sidebar: ReactNode
  children: ReactNode
}

export const MessageLayoutClient = ({ sidebar, children }: Props) => {
  const pathname = usePathname()

  const isChatPage = pathname === '/message/chat'

  return (
    <div className="flex min-h-[500px] gap-6">
      <div
        className={cn(
          'transition-all duration-300 md:block md:fixed md:top-81 md:w-64',
          isChatPage ? 'block w-full' : 'hidden'
        )}
      >
        {sidebar}
      </div>

      <div
        className={cn(
          'flex-1 transition-all duration-300',
          'md:block md:pl-68',
          isChatPage ? 'hidden' : 'block'
        )}
      >
        {children}
      </div>
    </div>
  )
}
