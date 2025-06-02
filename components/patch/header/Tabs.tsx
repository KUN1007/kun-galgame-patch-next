'use client'

import { Tab, Tabs } from "@heroui/tabs"
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface PatchHeaderProps {
  id: number
}

export const PatchHeaderTabs = ({ id }: PatchHeaderProps) => {
  const pathname = usePathname()
  const lastSegment = pathname.split('/').filter(Boolean).pop()

  const tabs = [
    {
      key: 'introduction',
      title: '游戏介绍',
      href: `/patch/${id}/introduction`
    },
    { key: 'resource', title: '资源链接', href: `/patch/${id}/resource` },
    { key: 'comment', title: '游戏评论', href: `/patch/${id}/comment` },
    { key: 'walkthrough', title: '游戏攻略', href: `/patch/${id}/walkthrough` },
    { key: 'history', title: '贡献历史', href: `/patch/${id}/history` },
    { key: 'pr', title: '更新请求', href: `/patch/${id}/pr` }
  ]

  return (
    <Tabs
      aria-label="Options"
      className="z-10 w-full overflow-hidden rounded-large shadow-medium"
      fullWidth
      selectedKey={lastSegment}
    >
      {tabs.map(({ key, title, href }) => (
        <Tab
          key={key}
          as={Link}
          title={title}
          href={href}
          className="p-0 min-w-24 rounded-large"
        />
      ))}
    </Tabs>
  )
}
