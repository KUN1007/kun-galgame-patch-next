'use client'

import {
  NavbarContent,
  NavbarItem,
  Navbar as HeroUINavbar
} from "@heroui/react"

export const Navbar = () => {
  return (
    <HeroUINavbar>
      <NavbarContent justify="end">
        <NavbarItem>哦哈呦~</NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  )
}
