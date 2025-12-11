'use client'

import { KunTopBarBrand } from './Brand'
import { KunTopBarUser } from './User'
import { usePathname } from 'next/navigation'
import { kunNavItemDesktop } from '~/constants/top-bar'
import { KunMobileMenu } from './KunMobileMenu'
import { useEffect, useState } from 'react'
import {
  Navbar,
  NavbarContent,
  NavbarMenuToggle,
  Link,
  Tooltip
} from '@heroui/react'
import {
  Building2,
  Gamepad2,
  Puzzle,
  Tags,
  BookUser,
  Clapperboard,
  ChartColumnBig
} from 'lucide-react'
import { cn } from '~/utils/cn'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { useUserStore } from '~/store/userStore'

export const KunTopBar = () => {
  const pathname = usePathname()
  const currentUser = useUserStore((state) => state.user)

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const items: Array<{ href: string; label: string; icon: React.ReactNode }> = [
    {
      href: '/galgame',
      label: 'Galgame 列表',
      icon: <Gamepad2 className="size-4" />
    },
    {
      href: '/resource',
      label: '最新补丁列表',
      icon: <Puzzle className="size-4" />
    },
    {
      href: '/tag',
      label: 'Galgame 标签列表',
      icon: <Tags className="size-4" />
    },
    {
      href: '/company',
      label: 'Galgame 会社列表',
      icon: <Building2 className="size-4" />
    },
    {
      href: '/character',
      label: 'Galgame 角色列表',
      icon: <BookUser className="size-4" />
    },
    {
      href: '/person',
      label: 'Galgame 制作人列表',
      icon: <Clapperboard className="size-4" />
    },
    {
      href: '/ranking',
      label: 'Galgame 排行',
      icon: <ChartColumnBig className="size-4" />
    }
  ]

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <Navbar
      maxWidth="xl"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      classNames={{ wrapper: 'px-3' }}
    >
      <NavbarContent className="md:hidden" justify="start">
        <li className="h-full">
          <NavbarMenuToggle />
        </li>
      </NavbarContent>

      <KunTopBarBrand />

      <div className="hidden md:flex items-center gap-6">
        <Tooltip
          content={
            <nav className="p-2 space-y-1">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-default-700 hover:bg-default-100"
                >
                  <span className="shrink-0 text-default-600">{it.icon}</span>
                  <span className="truncate">{it.label}</span>
                </Link>
              ))}
            </nav>
          }
        >
          <Link
            href="/galgame"
            className={cn(
              'text-base shrink-0',
              pathname === '/galgame' ? 'text-primary' : 'text-foreground'
            )}
          >
            下载补丁
          </Link>
        </Tooltip>

        {kunNavItemDesktop.map((item) => (
          <Link
            key={item.href}
            className={cn(
              'text-base shrink-0',
              pathname === item.href ? 'text-primary' : 'text-foreground'
            )}
            href={item.href}
            color="primary"
          >
            {item.name}
          </Link>
        ))}

        {(!currentUser.uid || currentUser.role < 2) && (
          <Tooltip disableAnimation content="为什么现在的 AI 比人还要 H">
            <a target="_blank" href={kunMoyuMoe.ad[0].url} rel="noreferrer">
              <img
                className="h-10 dark:opacity-80"
                src="/a/moyumoe1-button.avif"
              />
            </a>
          </Tooltip>
        )}
      </div>

      <KunTopBarUser />

      <KunMobileMenu />
    </Navbar>
  )
}
