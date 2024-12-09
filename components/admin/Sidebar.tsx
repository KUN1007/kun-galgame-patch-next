'use client'

import { useState } from 'react'
import { Chip } from '@nextui-org/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  FileClock,
  Gamepad2,
  MessageSquare,
  Puzzle,
  Settings,
  Users
} from 'lucide-react'
import { cn } from '~/utils/cn'

const menuItems = [
  {
    name: '用户管理',
    href: '/admin/user',
    icon: Users
  },
  {
    name: '创作者管理',
    href: '/admin/creator',
    icon: BadgeCheck
  },
  {
    name: '补丁资源管理',
    href: '/admin/resource',
    icon: Puzzle
  },
  {
    name: 'Galgame 管理',
    href: '/admin/galgame',
    icon: Gamepad2
  },
  {
    name: '评论管理',
    href: '/admin/comment',
    icon: MessageSquare
  },
  {
    name: '管理日志',
    href: '/admin/log',
    icon: FileClock
  },
  {
    name: '网站设置',
    href: '/admin/setting',
    icon: Settings
  }
]

export const Sidebar = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <aside
      className={cn(
        'fixed z-50 md:static w-64 h-full bg-background border-r border-divider transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'flex items-center'
      )}
    >
      <div className="flex flex-col size-full">
        <div className="p-4 pl-0">
          <h2 className="text-xl font-bold">管理面板</h2>
        </div>

        <nav className="flex-1 p-4 pl-0">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-medium px-4 py-2 transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-default-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <Chip
        className="translate-x-3 text-default-500 md:hidden"
        variant="light"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </Chip>
    </aside>
  )
}
