'use client'

import { Button } from '@nextui-org/react'
import { Bell, UserPlus, Globe } from 'lucide-react'
import { Card, CardBody } from '@nextui-org/card'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const notificationTypes = [
  { type: 'notice', label: '全部消息', icon: Bell, href: '/message/notice' },
  {
    type: 'follow',
    label: '关注消息',
    icon: UserPlus,
    href: '/message/follow'
  },
  { type: 'system', label: '系统消息', icon: Globe, href: '/message/system' }
]

export const MessageNav = () => {
  const pathname = usePathname()
  const lastSegment = pathname.split('/').filter(Boolean).pop()

  return (
    <Card className="w-full lg:w-1/4">
      <CardBody className="flex flex-row gap-2 lg:flex-col">
        {notificationTypes.map(({ type, label, icon: Icon, href }) => (
          <Button
            key={label}
            color={lastSegment === type ? 'primary' : 'default'}
            as={Link}
            className="justify-start w-full"
            variant={lastSegment === type ? 'solid' : 'light'}
            startContent={<Icon className="flex-shrink-0 w-4 h-4" />}
            href={href}
          >
            <span>{label}</span>
          </Button>
        ))}
      </CardBody>
    </Card>
  )
}
