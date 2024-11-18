'use client'

import {
  Navbar,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarContent,
  NavbarItem
} from '@nextui-org/navbar'
import { Link } from '@nextui-org/link'
import { KunTopBarBrand } from './Brand'
import { KunTopBarUser } from './User'
import { usePathname } from 'next/navigation'

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
  },
  {
    name: '主站论坛',
    href: '/'
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
        <ul className="justify-start hidden gap-4 pl-2 md:flex">
          {kunNavItem.map((item) => (
            <NavbarItem key={item.href} isActive={pathname === item.href}>
              <Link
                color={pathname === item.href ? 'primary' : 'foreground'}
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
              className="w-full"
              color={
                index === 2
                  ? 'warning'
                  : index === menuItems.length - 1
                    ? 'danger'
                    : 'foreground'
              }
              href="#"
              size="lg"
            >
              {item}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  )
}
