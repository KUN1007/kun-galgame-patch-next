'use client'

import { Tabs, Tab } from '@heroui/tabs'
import { Chip, Tooltip, Link } from '@heroui/react'
import type { PatchDetail } from '~/types/api/patch'
import { useMemo, useState } from 'react'

export const TagSection = ({ detail }: { detail: PatchDetail }) => {
  const [provider, setProvider] = useState<'vndb' | 'bangumi'>('vndb')

  const tags = useMemo(() => {
    return detail.tag.filter((t) => t.provider === provider)
  }, [detail.tag, provider])

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded" />
          <h2 className="text-2xl font-bold">标签</h2>
        </div>
        <Tabs
          aria-label="标签来源"
          selectedKey={provider}
          onSelectionChange={(key) => setProvider(key as 'vndb' | 'bangumi')}
          variant="underlined"
        >
          <Tab key="vndb" title="VNDB" />
          <Tab key="bangumi" title="Bangumi" />
        </Tabs>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tooltip
            key={`${tag.provider}-${tag.id}`}
            content={`分类：${tag.category}`}
          >
            <Chip
              as={Link}
              href={
                tag.provider === 'vndb' ? `/tag/${tag.id}` : `/tag/${tag.id}`
              }
              color={tag.provider === 'vndb' ? 'primary' : 'secondary'}
              variant="flat"
            >
              {tag.name}
              {tag.spoiler_level > 0 ? ' · 剧透' : ''}
            </Chip>
          </Tooltip>
        ))}
        {tags.length === 0 && <Chip>暂无标签, 或者您未开启网站 R18 开关</Chip>}
      </div>
    </section>
  )
}
