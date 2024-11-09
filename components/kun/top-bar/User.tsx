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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/modal'
import {
  Search,
  Lollipop,
  UserRound,
  Settings,
  CircleHelp,
  LogOut
} from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '~/lib/trpc-client'
import toast from 'react-hot-toast'
import { ThemeSwitcher } from '~/components/kun/ThemeSwitcher'
import { useMounted } from '~/hooks/useMounted'

export const KunTopBarUser = () => {
  const router = useRouter()
  const { user, logout } = useUserStore()
  const isMounted = useMounted()
  const [loading, setLoading] = useState(false)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const handleLogOut = async () => {
    setLoading(true)
    await api.user.logout.mutate()
    setLoading(false)
    logout()
    router.push('/login')
    toast.success('您已经成功登出!')
  }

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

          <Button isIconOnly variant="light">
            <Search className="w-6 h-6 text-default-500" />
          </Button>

          <ThemeSwitcher />

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
                  onPress={onOpen}
                >
                  退出登录
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </>
      ) : (
        <Skeleton className="rounded-lg">
          <div className="w-32 h-10 bg-gray-300 rounded-lg" />
        </Skeleton>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                您确定要登出网站吗?
              </ModalHeader>
              <ModalBody>
                <p>
                  登出将会清除您的登录状态, 但是不会清除您的编辑草稿 (Galgame,
                  回复等), 您可以稍后继续登录
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  关闭
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    handleLogOut()
                    onClose()
                  }}
                  isLoading={loading}
                  disabled={loading}
                >
                  确定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </NavbarContent>
  )
}
