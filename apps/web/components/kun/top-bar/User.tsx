'use client'

import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { NavbarContent, NavbarItem } from '@heroui/navbar'
import Link from 'next/link'
import { Button } from '@heroui/button'
import { Skeleton } from '@heroui/skeleton'
import { useUserStore } from '~/store/userStore'
import { useRouter } from 'next/navigation'
import { kunFetchGet } from '~/utils/kunFetch'
import { ThemeSwitcher } from './ThemeSwitcher'
import { useMounted } from '~/hooks/useMounted'
import { UserDropdown } from './UserDropdown'
import { KunSearch } from './Search'
import { UserMessageBell } from './UserMessageBell'
import { NSFWSwitcher } from './NSFWSwitcher'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { RandomGalgameButton } from './RandomGalgameButton'
import { Tooltip } from '@heroui/react'
import type { UserState } from '~/store/userStore'

export const KunTopBarUser = () => {
  const router = useRouter()
  const { user, setUser, logout } = useUserStore()
  const [unreadMessageTypes, setUnreadMessageTypes] = useState<string[]>([])
  const isMounted = useMounted()

  const getUserStatus = async () => {
    const res = await kunFetchGet<KunResponse<UserState>>('/user/status')
    if (typeof res === 'string') {
      toast.error(res)
      logout()
      router.push('/login')
    } else {
      setUser({ ...res, mutedMessageTypes: user.mutedMessageTypes ?? [] })
    }
  }

  const getUserUnreadMessage = async () => {
    const response = await kunFetchGet<KunResponse<string[]>>('/message/unread')
    kunErrorHandler(response, (value) => {
      setUnreadMessageTypes(value)
    })
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    if (!user.uid) {
      return
    }
    getUserStatus()
    getUserUnreadMessage()
  }, [isMounted])

  return (
    <NavbarContent as="div" className="items-center" justify="end">
      {isMounted ? (
        <>
          {!user.name && (
            <NavbarContent justify="end">
              <NavbarItem>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  as={Link}
                  href="/login"
                >
                  登录
                </Button>
              </NavbarItem>
              <NavbarItem className="hidden lg:flex">
                <Button size="sm" as={Link} color="primary" href="/register">
                  注册
                </Button>
              </NavbarItem>
            </NavbarContent>
          )}

          <NSFWSwitcher />

          <KunSearch />

          <Tooltip disableAnimation content="随机一部游戏">
            <RandomGalgameButton
              className="hidden sm:flex"
              isIconOnly
              variant="light"
              size="sm"
            />
          </Tooltip>

          <div className="hidden sm:flex">
            <ThemeSwitcher />
          </div>

          {user.name && (
            <>
              <UserMessageBell
                unreadMessageTypes={unreadMessageTypes}
                readMessages={() => setUnreadMessageTypes([])}
              />

              <UserDropdown />
            </>
          )}
        </>
      ) : (
        <Skeleton className="rounded-lg">
          <div className="w-32 h-10 rounded-lg bg-default-300" />
        </Skeleton>
      )}
    </NavbarContent>
  )
}
