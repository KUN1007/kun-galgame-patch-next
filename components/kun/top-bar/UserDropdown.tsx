'use client'

import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu
} from '@nextui-org/dropdown'
import { Avatar } from '@nextui-org/avatar'
import { Button } from '@nextui-org/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/modal'
import {
  Lollipop,
  UserRound,
  Settings,
  CircleHelp,
  LogOut,
  CalendarCheck,
  Sparkles
} from 'lucide-react'
import { useUserStore } from '~/store/providers/user'
import { useState } from 'react'
import { useRouter } from 'next-nprogress-bar'
import { kunFetchPost } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { showKunSooner } from '~/components/kun/Sooner'
import { useErrorHandler } from '~/hooks/useErrorHandler'

export const UserDropdown = () => {
  const router = useRouter()
  const { user, setUser, logout } = useUserStore((state) => state)
  const [loading, setLoading] = useState(false)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const handleLogOut = async () => {
    setLoading(true)
    await kunFetchPost<KunResponse<{}>>('/user/user/status/logout')
    setLoading(false)
    logout()
    router.push('/login')
    toast.success('您已经成功登出!')
  }

  const [checking, setChecking] = useState(false)
  const handleCheckIn = async () => {
    if (checking) {
      return
    }

    setChecking(true)
    const res = await kunFetchPost<
      KunResponse<{
        randomMoemoepoints: number
      }>
    >('/user/user/status/check-in')
    useErrorHandler(res, (value) => {
      showKunSooner(
        value
          ? `签到成功! 您今天获得了 ${value.randomMoemoepoints} 萌萌点`
          : '您的运气不好...今天没有获得萌萌点...'
      )
      setUser({
        ...user,
        dailyCheckIn: 1,
        moemoepoint: user.moemoepoint + value.randomMoemoepoints
      })
    })
    setChecking(false)
  }

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            isBordered
            as="button"
            className="transition-transform shrink-0"
            color="secondary"
            name={user.name.charAt(0).toUpperCase()}
            size="sm"
            src={user.avatar}
            showFallback
          />
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Profile Actions"
          disabledKeys={user.dailyCheckIn ? ['check'] : []}
        >
          <DropdownItem
            key="username"
            textValue="用户名"
            className="data-[hover=true]:bg-background cursor-default"
          >
            <p className="font-semibold">{user.name}</p>
          </DropdownItem>
          <DropdownItem
            key="moemoepoint"
            textValue="萌萌点"
            className="data-[hover=true]:bg-background cursor-default"
            startContent={<Lollipop className="w-4 h-4" />}
            endContent={user.moemoepoint}
          >
            萌萌点
          </DropdownItem>
          <DropdownItem
            key="profile"
            onPress={() => router.push(`/user/${user.uid}/resource`)}
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

          <DropdownItem
            key="check"
            textValue="今日签到"
            color="secondary"
            startContent={<CalendarCheck className="w-4 h-4" />}
            endContent={
              user.dailyCheckIn ? (
                <span className="text-xs">签到过啦</span>
              ) : (
                <Sparkles className="w-5 h-5 text-secondary-500" />
              )
            }
            onPress={handleCheckIn}
          >
            今日签到
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

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
    </>
  )
}
