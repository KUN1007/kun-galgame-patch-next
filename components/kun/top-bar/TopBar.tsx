'use client'

import {
  Navbar,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle
} from '@nextui-org/navbar'
import Link from 'next/link'
import { KunTopBarBrand } from './Brand'
import { KunTopBarUser } from './User'
import { usePathname } from 'next/navigation'
import { kunNavItem } from '~/constants/top-bar'
import { KunMobileMenu } from './KunMobileMenu'

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

      <KunMobileMenu />
    </Navbar>
  )
}
