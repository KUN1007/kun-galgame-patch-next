'use client'

import {
  Navbar,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarContent,
  NavbarItem,
  Link
} from '@nextui-org/react'
import { KunTopBarBrand } from './Brand'
import { KunTopBarUser } from './User'

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

export const KunTopBar = () => {
  return (
    <Navbar maxWidth="xl">
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarContent className="hidden gap-3 sm:flex">
        <KunTopBarBrand />
        <NavbarItem>
          <Link color="foreground" href="#">
            补丁下载
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link href="/edit/create" aria-current="page">
            发布补丁
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="#">
            关于我们
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="#">
            主站论坛
          </Link>
        </NavbarItem>
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
