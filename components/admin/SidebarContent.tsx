'use client'

import Link from 'next/link'
import {
  BadgeCheck,
  FileClock,
  Gamepad2,
  MessageSquare,
  Puzzle,
  Settings,
  Users
} from 'lucide-react'

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

export const SidebarContent = ({ pathname }: { pathname: string }) => {
  return (
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
  )
}
