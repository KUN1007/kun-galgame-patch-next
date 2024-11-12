import DOMPurify from 'isomorphic-dompurify'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Calendar, Clock, Link } from 'lucide-react'
import { formatDate } from '~/utils/time'
import type { Patch } from '~/types/api/patch'

export default async function PatchIntroduction() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">游戏介绍</h2>
      </CardHeader>
      {/* <CardBody className="space-y-6">
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(patch.introduction)
          }}
          className="prose max-w-none dark:prose-invert"
        />

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              更新时间: {formatDate(patch.created, { isShowYear: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              更新时间: {formatDate(patch.updated, { isShowYear: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link className="w-4 h-4" />
            <span>VNDB ID: {patch.vndbId}</span>
          </div>
        </div>

        {patch.alias.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-4 text-xl font-medium">游戏别名</h3>
            <ul className="text-sm text-gray-500 list-disc list-inside">
              {patch.alias.map((alias) => (
                <li key={alias}>{alias}</li>
              ))}
            </ul>
          </div>
        )}
      </CardBody> */}
    </Card>
  )
}
