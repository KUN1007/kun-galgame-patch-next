'use client'

import {
  Navbar,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle
} from '@nextui-org/navbar'
import Link from 'next/link'
import { KunTopBarBrand } from './Brand'
import { KunTopBarUser } from './User'
import { usePathname } from 'next/navigation'
import { cn } from '~/utils/cn'

const menuItems = [
  'Profile',
  'Dashboard',
  'Activity',
  'Analytics',
  'System',
  'Deployments',
  'My Settings',
  'Team Settings',
  'Help & Feedback',
  'Log Out'
]

interface KunNavItem {
  name: string
  href: string
}

const kunNavItem: KunNavItem[] = [
  {
    name: '补丁下载',
    href: '/galgame'
  },
  {
    name: '发布补丁',
    href: '/edit/create'
  },
  {
    name: '补丁标签',
    href: '/tag'
  },
  {
    name: '关于我们',
    href: '/about'
  }
]

export const KunTopBar = () => {
  const pathname = usePathname()

  return (
    <Navbar maxWidth="xl">
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarContent className="hidden gap-3 sm:flex">
        <KunTopBarBrand />
        <ul className="hidden justify-start gap-4 pl-2 md:flex">
          {kunNavItem.map((item) => (
            <NavbarItem key={item.href} isActive={pathname === item.href}>
              <Link
                className={
                  pathname === item.href ? 'text-primary' : 'text-foreground'
                }
                href={item.href}
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <KunTopBarUser />

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              className={cn(
                'w-full',
                index === 2
                  ? 'text-warning'
                  : index === menuItems.length - 1
                    ? 'text-danger'
                    : 'text-foreground'
              )}
              href="#"
            >
              {item}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  )
}
