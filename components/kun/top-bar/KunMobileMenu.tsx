'use client'

import { NavbarMenu, NavbarMenuItem } from '@heroui/navbar'
import { Chip } from '@heroui/chip'
import Link from 'next/link'
import Image from 'next/image'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { kunMobileNavItem } from '~/constants/top-bar'
import { RandomGalgameButton } from './RandomGalgameButton'

export const KunMobileMenu = () => {
  return (
    <NavbarMenu>
      <NavbarMenuItem>
        <Link className="flex items-center" href="/">
          <Image
            src="/favicon.webp"
            alt={kunMoyuMoe.titleShort}
            width={50}
            height={50}
            priority
          />
          <p className="ml-4 mr-2 font-bold text-inherit">
            {kunMoyuMoe.creator.name}
          </p>
          <Chip size="sm" variant="flat" color="primary">
            补丁
          </Chip>
        </Link>
      </NavbarMenuItem>
      {kunMobileNavItem.map((item, index) => (
        <NavbarMenuItem key={index}>
          <Link className="w-full" href={item.href}>
            {item.name}
          </Link>
        </NavbarMenuItem>
      ))}

      <NavbarMenuItem>
        <RandomGalgameButton variant="flat" color="primary" />
      </NavbarMenuItem>
    </NavbarMenu>
  )
}
