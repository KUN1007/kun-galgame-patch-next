'use client'

import { Tabs, Tab } from '@nextui-org/tabs'
import { usePathname } from 'next/navigation'

interface PatchHeaderProps {
  id: number
}

export const PatchHeaderTabs = ({ id }: PatchHeaderProps) => {
  const pathname = usePathname()
  const lastSegment = pathname.split('/').filter(Boolean).pop()

  return (
    <Tabs
      aria-label="Options"
      className="w-full overflow-hidden shadow-medium rounded-large"
      fullWidth={true}
      selectedKey={lastSegment}
      color="primary"
    >
      <Tab
        key="introduction"
        title="游戏介绍"
        className="p-0 min-w-24"
        href={`/patch/${id}/introduction`}
      />
      <Tab
        key="resource"
        title="资源链接"
        className="p-0 min-w-24"
        href={`/patch/${id}/resource`}
      />
      <Tab
        key="comment"
        title="游戏评论"
        className="p-0 min-w-24"
        href={`/patch/${id}/comment`}
      />
      <Tab
        key="history"
        title="贡献历史"
        className="p-0 min-w-24"
        href={`/patch/${id}/history`}
      />
      <Tab
        key="pr"
        title="更新请求"
        className="p-0 min-w-24"
        href={`/patch/${id}/pr`}
      />
    </Tabs>
  )
}
