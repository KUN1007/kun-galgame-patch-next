'use client'

import { useEffect, useState } from 'react'
import { NavbarContent, NavbarItem } from '@nextui-org/navbar'
import { Link } from '@nextui-org/link'
import { Button } from '@nextui-org/button'
import { Skeleton } from '@nextui-org/skeleton'
import { Search } from 'lucide-react'
import { useUserStore } from '~/store/providers/user'
import { useRouter } from 'next-nprogress-bar'
import { api } from '~/lib/trpc-client'
import { ThemeSwitcher } from '~/components/kun/ThemeSwitcher'
import { useMounted } from '~/hooks/useMounted'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import { UserDropdown } from './UserDropdown'
import { UserMessageBell } from './UserMessageBell'

export const KunTopBarUser = () => {
  const router = useRouter()
  const { user, setUser } = useUserStore((state) => state)
  const [hasUnread, setHasUnread] = useState(false)
  const isMounted = useMounted()

  useEffect(() => {
    if (!isMounted) {
      return
    }
    if (!user.uid) {
      return
    }

    const getUserStatus = async () => {
      const user = await api.user.status.query()
      useErrorHandler(user, (value) => {
        setUser(value)
      })
    }
    const getUserUnreadMessage = async () => {
      const message = await api.message.getUnread.query()
      if (message) {
        setHasUnread(true)
      }
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
              <NavbarItem className="hidden lg:flex">
                <Link href="/login">登录</Link>
              </NavbarItem>
              <NavbarItem>
                <Button
                  as={Link}
                  color="primary"
                  href="/register"
                  variant="flat"
                >
                  注册
                </Button>
              </NavbarItem>
            </NavbarContent>
          )}

          <Button
            isIconOnly
            variant="light"
            onClick={() => router.push('/search')}
          >
            <Search className="w-6 h-6 text-default-500" />
          </Button>

          <ThemeSwitcher />

          {user.name && (
            <>
              <UserMessageBell
                hasUnreadMessages={hasUnread}
                setReadMessage={() => setHasUnread(false)}
              />

              <UserDropdown />
            </>
          )}
        </>
      ) : (
        <Skeleton className="rounded-lg">
          <div className="w-32 h-10 bg-gray-300 rounded-lg" />
        </Skeleton>
      )}
    </NavbarContent>
  )
}
