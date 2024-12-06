import DOMPurify from 'isomorphic-dompurify'
import { Calendar, Clock, Link, RefreshCw } from 'lucide-react'
import { formatDate } from '~/utils/time'
import type { PatchIntroduction } from '~/types/api/patch'

interface Props {
  intro: PatchIntroduction
}

export const Info = ({ intro }: Props) => {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(intro.introduction)
        }}
        className="prose max-w-none dark:prose-invert"
      />

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="size-4" />
          <span>
            发布时间: {formatDate(intro.created, { isShowYear: true })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="size-4" />
          <span>
            更新时间: {formatDate(intro.updated, { isShowYear: true })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link className="size-4" />
          <span>VNDB ID: {intro.vndbId}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="size-4" />
          <span>发售时间: {intro.released}</span>
        </div>
      </div>

      {intro.alias.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-4 text-xl font-medium">游戏别名</h3>
          <ul className="list-inside list-disc text-sm text-gray-500">
            {intro.alias.map((alias) => (
              <li key={Math.random()}>{alias}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
