'use client'

import { useMemo, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { Building2, Calendar, Clock, Link, RefreshCw, Tv } from 'lucide-react'
import { Select, SelectItem, Link as HeroLink, Chip } from '@heroui/react'
import { formatDate } from '~/utils/time'
import { GALGAME_SORT_YEARS_MAP } from '~/constants/galgame'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchDetail } from '~/types/api/patch'

export const OverviewSection = ({ detail }: { detail: PatchDetail }) => {
  const initialLang: Language =
    (['zh-cn', 'ja-jp', 'en-us'] as Language[]).find(
      (l) => detail.introduction[l]
    ) || 'zh-cn'

  const [lang, setLang] = useState<Language>(initialLang)

  const introHtml = useMemo(() => {
    const html = getPreferredLanguageText(detail.introduction, lang)
    return DOMPurify.sanitize(html)
  }, [lang, detail.introduction])

  const hasIntro = Boolean(
    detail.introduction['zh-cn'] ||
    detail.introduction['ja-jp'] ||
    detail.introduction['en-us']
  )

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded" />
        <h2 className="text-2xl font-bold text-gray-900">简介</h2>

        <Select
          selectedKeys={[lang]}
          defaultSelectedKeys={[lang]}
          size="sm"
          onSelectionChange={(keys) => {
            const k = Array.from(keys)[0] as 'zh-cn'
            if (k) {
              setLang(k)
            }
          }}
          classNames={{
            base: 'max-w-36'
          }}
          aria-label="语言"
        >
          <SelectItem key="zh-cn">中文</SelectItem>
          <SelectItem key="ja-jp">日本語</SelectItem>
          <SelectItem key="en-us">English</SelectItem>
        </Select>
      </div>
      <div className="space-y-4">
        {hasIntro && (
          <div className="space-y-3">
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
              <span>
                VNDB ID:{' '}
                {
                  <HeroLink
                    isExternal
                    showAnchorIcon
                    underline="always"
                    href={`https://vndb.org/${detail.vndbId}`}
                    size="sm"
                  >
                    {detail.vndbId}
                  </HeroLink>
                }
              </span>
            </div>
          )}
          {detail.bid && (
            <div className="flex items-center gap-2 text-sm text-default-500">
              <Tv className="size-4" />
              <div>
                Bangumi ID:{' '}
                {
                  <HeroLink
                    isExternal
                    showAnchorIcon
                    underline="always"
                    href={`https://bangumi.tv/subject/${detail.bid}`}
                    size="sm"
                  >
                    {detail.bid}
                  </HeroLink>
                }
              </div>
            </div>
          )}
        </div>

        {!!detail.company.length && (
          <div className="flex text-sm text-default-500 flex-wrap items-center gap-2">
            <Building2 className="size-4" />
            <span className="shrink-0">制作会社:</span>
            {detail.company.map((c) => (
              <HeroLink
                size="sm"
                key={c.id}
                underline="always"
                href={`/company/${c.id}`}
              >
                {`${c.name} +${c.count}`}
              </HeroLink>
            ))}
          </div>
        )}

        {!!detail.alias.length && (
          <div className="flex text-sm text-default-500 flex-wrap items-center gap-2">
            <Building2 className="size-4" />
            <span className="shrink-0">别名:</span>
            {detail.alias.map((a) => (
              <span key={a.id}>{a.name} · </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
