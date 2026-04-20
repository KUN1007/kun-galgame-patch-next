'use client'

import { Tab, Tabs } from '@heroui/tabs'
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
      title: 'Galgame 信息',
      href: `/patch/${id}/introduction`
    },
    { key: 'resource', title: '补丁资源下载', href: `/patch/${id}/resource` },
    { key: 'comment', title: '游戏评论', href: `/patch/${id}/comment` }
  ]

  return (
    <Tabs
      aria-label="Options"
      color="primary"
      selectedKey={lastSegment}
      variant="underlined"
    >
      {tabs.map(({ key, title, href }) => (
        <Tab key={key} as={Link} title={title} href={href} />
      ))}
    </Tabs>
  )
}
