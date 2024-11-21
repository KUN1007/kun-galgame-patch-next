'use client'

import { Card, CardBody } from '@nextui-org/card'
import { Tab, Tabs } from '@nextui-org/tabs'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface UserActivityProps {
  id: number
}

export const UserActivity = ({ id }: UserActivityProps) => {
  const pathname = usePathname()
  const lastSegment = pathname.split('/').filter(Boolean).pop()

  const tabs = [
    { key: 'resource', title: '补丁资源', href: `/user/${id}/resource` },
    { key: 'galgame', title: 'Galgame', href: `/user/${id}/galgame` },
    { key: 'contribute', title: '贡献', href: `/user/${id}/contribute` },
    { key: 'comment', title: '评论', href: `/user/${id}/comment` },
    { key: 'favorite', title: '收藏', href: `/user/${id}/favorite` }
  ]

  return (
    <Card className="w-full">
      <CardBody>
        <Tabs
          aria-label="用户活动"
          variant="underlined"
          fullWidth
          selectedKey={lastSegment}
        >
          {tabs.map(({ key, title, href }) => (
            <Tab key={key} as={Link} title={title} href={href} />
          ))}
        </Tabs>
      </CardBody>
    </Card>
  )
}
