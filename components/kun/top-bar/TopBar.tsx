'use client'

import { KunTopBarBrand } from './Brand'
import { KunTopBarUser } from './User'
import { usePathname } from 'next/navigation'
import { KunMobileMenu } from './KunMobileMenu'
import { useEffect, useState } from 'react'
import { Navbar, NavbarContent, NavbarMenuToggle } from '@heroui/react'

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
      classNames={{ wrapper: 'px-3' }}
    >
      <NavbarContent className="md:hidden" justify="start">
        <li className="h-full">
          <NavbarMenuToggle />
        </li>
      </NavbarContent>

      <KunTopBarBrand />

      <KunTopBarUser />

      <KunMobileMenu />
    </Navbar>
  )
}
