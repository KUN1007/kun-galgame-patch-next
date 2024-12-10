'use client'

import { NavbarMenu, NavbarMenuItem } from '@nextui-org/navbar'
import Link from 'next/link'
import { kunMobileNavItem } from '~/constants/top-bar'

export const KunMobileMenu = () => {
  return (
    <NavbarMenu>
      {kunMobileNavItem.map((item, index) => (
        <NavbarMenuItem key={index}>
          <Link className="w-full" href={item.href}>
            {item.name}
          </Link>
        </NavbarMenuItem>
      ))}
    </NavbarMenu>
  )
}
