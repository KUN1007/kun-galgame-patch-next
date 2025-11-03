'use client'

import DOMPurify from 'isomorphic-dompurify'
import { Calendar, Clock, Link, RefreshCw } from 'lucide-react'
import type { PatchDetail } from '~/types/api/patch'
import { formatDate } from '~/utils/time'
import { GALGAME_SORT_YEARS_MAP } from '~/constants/galgame'

export const OverviewSection = ({ detail }: { detail: PatchDetail }) => (
  <section>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-6 bg-primary rounded" />
      <h2 className="text-2xl font-bold text-gray-900">概览</h2>
    </div>
    <div className="space-y-4">
      {(detail.introduction_zh_cn || detail.introduction_en_us) && (
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(detail.introduction_en_us)
          }}
          className="kun-prose max-w-none"
        />
      )}

      <div className="grid gap-4 mt-6 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-default-500">
          <Clock className="size-4" />
          <span>
            发布时间: {formatDate(detail.created, { isShowYear: true })}
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
