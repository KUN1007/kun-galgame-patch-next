'use client'

import { NavbarMenuItem } from '@heroui/navbar'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { useUserStore } from '~/store/userStore'

export const AIEroMobileNav = () => {
  const currentUser = useUserStore((state) => state.user)

  return (
    <>
      {(!currentUser.uid || currentUser.role < 2) && (
        <NavbarMenuItem>
          <a
            className="flex items-center gap-2"
            target="_blank"
            href={kunMoyuMoe.ad[0].url}
          >
            <img
              src="/a/moyumoe1-button.avif"
              className="h-11 dark:opacity-80"
              alt=""
            />
          </a>
        </NavbarMenuItem>
      )}
    </>
  )
}
