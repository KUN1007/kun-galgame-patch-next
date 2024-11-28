'use client'

import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarItem
} from '@nextui-org/react'

export const Navbar = () => {
  return (
    <NextUINavbar>
      <NavbarContent justify="end">
        <NavbarItem>哦哈呦~</NavbarItem>
      </NavbarContent>
    </NextUINavbar>
  )
}
