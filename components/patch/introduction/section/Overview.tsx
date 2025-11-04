'use client'

import { useMemo, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { Calendar, Clock, Link, RefreshCw } from 'lucide-react'
import { Select, SelectItem } from '@heroui/select'
import type { PatchDetail } from '~/types/api/patch'
import { formatDate } from '~/utils/time'
import { GALGAME_SORT_YEARS_MAP } from '~/constants/galgame'

export const OverviewSection = ({ detail }: { detail: PatchDetail }) => {
  const [lang, setLang] = useState<'zh' | 'ja' | 'en'>(() => {
    if (detail.introduction_zh_cn) return 'zh'
    if (detail.introduction_ja_jp) return 'ja'
    return 'en'
  })

  const introHtml = useMemo(() => {
    const html =
      lang === 'zh'
        ? detail.introduction_zh_cn
        : lang === 'ja'
          ? detail.introduction_ja_jp
          : detail.introduction_en_us
    return DOMPurify.sanitize(html)
  }, [lang, detail])

  const hasIntro = Boolean(
    detail.introduction_zh_cn ||
      detail.introduction_ja_jp ||
      detail.introduction_en_us
  )

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded" />
        <h2 className="text-2xl font-bold text-gray-900">简介</h2>
      </div>
      <div className="space-y-4">
        {hasIntro && (
          <div className="space-y-3">
            <div className="max-w-xs">
              <Select
                selectedKeys={[lang]}
                defaultSelectedKeys={[lang]}
                label="介绍语言"
                size="sm"
                onSelectionChange={(keys) => {
                  const k = Array.from(keys)[0] as 'zh' | 'ja' | 'en'
                  if (k) setLang(k)
                }}
              >
                <SelectItem key="zh">中文</SelectItem>
                <SelectItem key="ja">日本語</SelectItem>
                <SelectItem key="en">English</SelectItem>
              </Select>
            </div>
            <div
              className="kun-prose max-w-none"
              dangerouslySetInnerHTML={{ __html: introHtml }}
            />
          </div>
        )}

        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-default-500">
            <Clock className="size-4" />
            <span>
              创建时间: {formatDate(detail.created, { isShowYear: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-default-500">
            <RefreshCw className="size-4" />
            <span>
              更新时间: {formatDate(detail.updated, { isShowYear: true })}
            </span>
          </div>
          {detail.released && (
            <div className="flex items-center gap-2 text-sm text-default-500">
              <Calendar className="size-4" />
              <span>
                发售时间:{' '}
                {GALGAME_SORT_YEARS_MAP[detail.released] ?? detail.released}
              </span>
            </div>
          )}
          {detail.vndbId && (
            <div className="flex items-center gap-2 text-sm text-default-500">
              <Link className="size-4" />
              <span>VNDB ID: {detail.vndbId}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
