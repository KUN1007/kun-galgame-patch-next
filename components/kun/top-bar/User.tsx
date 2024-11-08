import {
  NavbarContent,
  NavbarItem,
  Link,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Button,
  Skeleton
} from '@nextui-org/react'
import {
  Search,
  Lollipop,
  UserRound,
  Settings,
  CircleHelp,
  LogOut
} from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export const KunTopBarUser = () => {
  const router = useRouter()
  const { user } = useUserStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setIsLoading(false)
    }
  }, [user])

  return (
    <NavbarContent as="div" className="items-center" justify="end">
      {isLoading ? (
        <Skeleton className="rounded-lg">
          <div className="w-32 h-10 bg-gray-300 rounded-lg" />
        </Skeleton>
      ) : (
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

          <Button isIconOnly variant="light">
            <Search className="w-6 h-6 text-default-500" />
          </Button>

          {user.name && (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform shrink-0"
                  color="secondary"
                  name={user.name}
                  size="sm"
                  src={user.avatar}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions">
                <DropdownItem key="username" textValue="用户名">
                  <p className="font-semibold">{user.name}</p>
                </DropdownItem>
                <DropdownItem
                  key="moemoepoint"
                  textValue="萌萌点"
                  startContent={<Lollipop className="w-4 h-4" />}
                  endContent={user.moemoepoint}
                >
                  萌萌点
                </DropdownItem>
                <DropdownItem
                  key="profile"
                  onPress={() => router.push(`/user/${user.uid}`)}
                  startContent={<UserRound className="w-4 h-4" />}
                >
                  用户主页
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  onPress={() => router.push('/settings/user')}
                  startContent={<Settings className="w-4 h-4" />}
                >
                  信息设置
                </DropdownItem>
                <DropdownItem
                  key="help_and_feedback"
                  onPress={() => router.push(`/about`)}
                  startContent={<CircleHelp className="w-4 h-4" />}
                >
                  帮助与反馈
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<LogOut className="w-4 h-4" />}
                >
                  退出登录
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </>
      )}
    </NavbarContent>
  )
}
