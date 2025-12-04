'use client'

import { NavbarMenu, NavbarMenuItem } from '@heroui/navbar'
import { Chip } from '@heroui/chip'
import Link from 'next/link'
import Image from 'next/image'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { kunMobileNavItem } from '~/constants/top-bar'
import { Divider } from '@heroui/react'
import { Heart } from 'lucide-react'

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
            className="rounded-2xl"
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

      <Divider className="my-3" />

      <NavbarMenuItem>
        <div className="space-y-2">
          <p>为什么现在的 AI 比人还要 H</p>
          <a
            className="flex items-center gap-2"
            target="_blank"
            href="https://s.iloveren.link/s/moyumoe1"
          >
            <img
              src="/a/moyumoe1-button.avif"
              className="h-11 dark:opacity-80"
            />
            <span className="gap-2 flex items-center text-lg text-secondary px-4 py-2 rounded-2xl bg-secondary/15">
              尝试一下 AI 女友
            </span>
          </a>
        </div>
      </NavbarMenuItem>
    </NavbarMenu>
  )
}
