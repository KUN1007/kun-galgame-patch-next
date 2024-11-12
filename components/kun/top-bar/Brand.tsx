'use client'

import { NavbarBrand, Chip } from '@nextui-org/react'

export const KunTopBarBrand = () => {
  return (
    <NavbarBrand className="hidden mr-16 sm:flex grow-0">
      <img src="/favicon.webp" alt="鲲 Galgame 补丁" width={50} height={50} />
      <p className="ml-4 font-bold text-inherit">ACME</p>
      <Chip size="sm" variant="flat" color="primary" className="ml-2">
        补丁
      </Chip>
    </NavbarBrand>
  )
}
