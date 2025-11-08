'use client'

import { Tabs, Tab } from '@heroui/tabs'
import { Chip, Tooltip, Link, Checkbox, ScrollShadow } from '@heroui/react'
import { useMemo, useState } from 'react'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchDetail } from '~/types/api/patch'
import { KunNull } from '~/components/kun/Null'

export const TagSection = ({ detail }: { detail: PatchDetail }) => {
  const [provider, setProvider] = useState<'vndb' | 'bangumi'>('vndb')
  const [showSpoiler, setShowSpoiler] = useState(false)

  const tags = useMemo(() => {
    const base = detail.tag.filter((t) => t.provider === provider)
    return showSpoiler ? base : base.filter((t) => (t.spoiler_level ?? 0) === 0)
  }, [detail.tag, provider, showSpoiler])

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded" />
          <h2 className="text-2xl font-bold">标签</h2>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox
            isSelected={showSpoiler}
            onValueChange={(v) => setShowSpoiler(!!v)}
          >
            显示剧透
          </Checkbox>
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
      </div>

      <ScrollShadow className="max-h-[300px]">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Tooltip
              key={`${tag.provider}-${tag.id}`}
              content={`${tag.count} 个 Galgame 含有此标签`}
            >
              <Chip
                as={Link}
                href={
                  tag.provider === 'vndb' ? `/tag/${tag.id}` : `/tag/${tag.id}`
                }
                color={
                  tag.category === 'content'
                    ? 'primary'
                    : tag.category === 'sexual'
                      ? 'danger'
                      : 'success'
                }
                variant="flat"
              >
                {`${getPreferredLanguageText(tag.name)} +${tag.count}`}
                {tag.spoiler_level > 0 ? (
                  <span className="font-bold text-warning-600"> *剧透</span>
                ) : (
                  ''
                )}
              </Chip>
            </Tooltip>
          ))}
          {tags.length === 0 && (
            <KunNull message="暂无标签, 或者您未开启网站 NSFW 模式" />
          )}
        </div>
      </ScrollShadow>
    </section>
  )
}
