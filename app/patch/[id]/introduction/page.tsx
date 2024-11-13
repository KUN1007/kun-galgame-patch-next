import DOMPurify from 'isomorphic-dompurify'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Calendar, Clock, Link, RefreshCw } from 'lucide-react'
import { formatDate } from '~/utils/time'
import { serverApi } from '~/lib/trpc-server'
import { ErrorComponent } from '~/components/error/ErrorComponent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchIntroduction({ params }: Props) {
  const { id } = await params

  const res = await serverApi.patch.getPatchIntroduction.query({
    patchId: Number(id)
  })
  if (!res || typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">游戏介绍</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(res.introduction)
          }}
          className="prose max-w-none dark:prose-invert"
        />

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              发布时间: {formatDate(res.updated, { isShowYear: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="w-4 h-4" />
            <span>
              更新时间: {formatDate(res.created, { isShowYear: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link className="w-4 h-4" />
            <span>VNDB ID: {res.vndbId}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>发售时间: {res.released}</span>
          </div>
        </div>

        {res.alias.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-4 text-xl font-medium">游戏别名</h3>
            <ul className="text-sm text-gray-500 list-disc list-inside">
              {res.alias.map((alias) => (
                <li key={alias}>{alias}</li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
