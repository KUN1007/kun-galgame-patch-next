'use client'

import { Tooltip } from '@heroui/react'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { useUserStore } from '~/store/userStore'

export const AIEroNav = () => {
  const currentUser = useUserStore((state) => state.user)

  return (
    <>
      {(!currentUser.uid || currentUser.role < 2) && (
        <Tooltip disableAnimation content="为什么现在的 AI 比人还要 H">
          <a target="_blank" href={kunMoyuMoe.ad[0].url}>
            <img
              className="h-10 dark:opacity-80"
              src="/a/moyumoe1-button.avif"
              alt=""
            />
          </a>
        </Tooltip>
      )}
    </>
  )
}
