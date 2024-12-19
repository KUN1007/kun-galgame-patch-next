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
import { useEffect, useState } from 'react'

export const KunTopBar = () => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <Navbar
      maxWidth="xl"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="sm:hidden" justify="start">
        <li className="h-full">
          <NavbarMenuToggle />
        </li>
      </NavbarContent>

      <KunTopBarBrand />

      <NavbarContent className="hidden gap-3 sm:flex">
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
      </NavbarContent>

      <KunTopBarUser />

      <KunMobileMenu />
    </Navbar>
  )
}
