'use client'

import { useEffect } from 'react'
import { kunFetchPut } from '~/utils/kunFetch'
import { Button } from '@nextui-org/react'
import { Bell, Globe, UserPlus, RefreshCcw, Puzzle, AtSign } from 'lucide-react'
import { Card, CardBody } from '@nextui-org/card'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const notificationTypes = [
  { type: 'notice', label: '全部消息', icon: Bell, href: '/message/notice' },
  {
    type: 'follow',
    label: '关注消息',
    icon: UserPlus,
    href: '/message/follow'
  },
  {
    type: 'patchResourceCreate',
    label: '新补丁资源发布消息',
    icon: Puzzle,
    href: '/message/patch-resource-create'
  },
  {
    type: 'patchResourceUpdate',
    label: '补丁资源更新消息',
    icon: RefreshCcw,
    href: '/message/patch-resource-update'
  },
  {
    type: 'mention',
    label: '@ 消息',
    icon: AtSign,
    href: '/message/mention'
  },
  { type: 'system', label: '系统消息', icon: Globe, href: '/message/system' }
]

export const MessageNav = () => {
  const pathname = usePathname()
  const lastSegment = pathname.split('/').filter(Boolean).pop()

  useEffect(() => {
    const readAllMessage = async () => {
      const res = await kunFetchPut<KunResponse<{}>>('/message/read')
      if (typeof res === 'string') {
        toast.error(res)
      }
    }
    readAllMessage()
  }, [])

  return (
    <Card className="w-full lg:w-1/4">
      <CardBody className="flex flex-row gap-2 lg:flex-col">
        {notificationTypes.map(({ type, label, icon: Icon, href }) => (
          <div key={label}>
            <Button
              color={lastSegment === type ? 'primary' : 'default'}
              as={Link}
              className="justify-start w-full"
              variant={lastSegment === type ? 'solid' : 'light'}
              startContent={<Icon className="size-4 shrink-0" />}
              href={href}
            >
              <span>{label}</span>
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
