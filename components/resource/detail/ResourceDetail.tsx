'use client'

import { Card, CardBody } from '@heroui/card'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import { PatchSummary } from './PatchSummary'
import { ResourceRecommendations } from './ResourceRecommendations'
import { Snippet } from '@heroui/snippet'
import { KunPatchAttribute } from '~/components/kun/PatchAttribute'
import DOMPurify from 'isomorphic-dompurify'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { ResourceLikeButton } from '~/components/patch/resource/ResourceLike'
import { ResourceDownloadCard } from './DownloadCard'
import type { PatchResourceDetail } from '~/types/api/resource'

interface Props {
  detail: PatchResourceDetail
}

export const KunResourceDetail = ({ detail }: Props) => {
  const resource = detail.resource

  return (
    <div className="space-y-10">
      <PatchSummary patch={detail.patch} />

      <div className="grid gap-8 lg:grid-cols-3">
        <ResourceRecommendations recommendations={detail.recommendations} />

        <Card className="col-span-2 border-default-200 border bg-content1/90 shadow-lg backdrop-blur-sm dark:bg-content1/70">
          <CardBody className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-default-900 dark:text-white">
                {detail.resource.name ||
                  `${getPreferredLanguageText(detail.patch.name)} 的补丁资源`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                该补丁资源最后更新于 {formatDistanceToNow(resource.updateTime)}
              </p>
            </div>

            <KunPatchAttribute
              types={resource.type}
              languages={resource.language}
              platforms={resource.platform}
              modelName={resource.modelName}
              downloadCount={resource.download}
            />

            <div>
              <KunUser
                user={resource.user}
                userProps={{
                  name: resource.user.name,
                  description: `发布于 ${formatDistanceToNow(resource.created)} • 已发布补丁 ${detail.resource.user.patchCount} 个`,
                  avatarProps: {
                    showFallback: true,
                    src: resource.user.avatar,
                    name: resource.user.name.charAt(0).toUpperCase()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              {resource.name && !resource.note && (
                <p className="mt-2 whitespace-pre-wrap">{resource.name}</p>
              )}

              {resource.note ? (
                <div className="w-full bg-warning-50 border border-warning rounded-2xl p-3">
                  <h2 className="text-lg">补丁备注</h2>
                  <p className="text-sm mb-3 text-default-500">
                    认真阅读下面的补丁资源备注, 以免产生问题
                  </p>
                  <div
                    className={`kun-prose max-w-none overflow-hidden transition-all duration-300 ease-in-out`}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(resource.noteHtml)
                    }}
                  />
                </div>
              ) : (
                <p>{resource.name}</p>
              )}
            </div>

            <ResourceDownloadCard resource={resource} />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {resource.code && (
                    <Snippet
                      tooltipProps={{
                        content: '点击复制提取码'
                      }}
                      size="sm"
                      symbol="提取码"
                      color="primary"
                      className="py-0"
                      variant="solid"
                    >
                      {resource.code}
                    </Snippet>
                  )}

                  {resource.password && (
                    <Snippet
                      tooltipProps={{
                        content: '点击复制解压码'
                      }}
                      size="sm"
                      symbol="解压码"
                      color="primary"
                      className="py-0"
                      variant="solid"
                    >
                      {resource.password}
                    </Snippet>
                  )}
                </div>

                <ResourceLikeButton resource={resource} />
              </div>

              <p className="flex justify-end text-sm text-default-500">
                收藏该补丁, 您将会收到补丁资源更新的通知
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
