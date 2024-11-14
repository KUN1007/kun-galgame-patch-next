import DOMPurify from 'isomorphic-dompurify'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { User } from '@nextui-org/user'
import { Button } from '@nextui-org/button'
import { Calendar, Clock, Link, RefreshCw } from 'lucide-react'
import { formatDate } from '~/utils/time'
import { serverApi } from '~/lib/trpc-server'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { HighlightedText } from '~/components/patch/DiffContent'
import { PatchPullRequest } from '~/components/patch/introduction/PullRequest'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchIntroduction({ params }: Props) {
  const { id } = await params

  const intro = await serverApi.patch.getPatchIntroduction.query({
    patchId: Number(id)
  })
  if (!intro || typeof intro === 'string') {
    return <ErrorComponent error={intro} />
  }

  const pr = await serverApi.patch.getPullRequest.query({
    patchId: Number(id)
  })

  return (
    <>
      <PatchPullRequest pr={pr} />
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-medium">游戏介绍</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(intro.introduction)
            }}
            className="prose max-w-none dark:prose-invert"
          />

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                发布时间: {formatDate(intro.updated, { isShowYear: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4" />
              <span>
                更新时间: {formatDate(intro.created, { isShowYear: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link className="w-4 h-4" />
              <span>VNDB ID: {intro.vndbId}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>发售时间: {intro.released}</span>
            </div>
          </div>

          {intro.alias.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-4 text-xl font-medium">游戏别名</h3>
              <ul className="text-sm text-gray-500 list-disc list-inside">
                {intro.alias.map((alias) => (
                  <li key={alias}>{alias}</li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
