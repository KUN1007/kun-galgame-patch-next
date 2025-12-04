'use client'

import { Card, CardBody } from '@heroui/card'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import { PatchSummary } from './PatchSummary'
import { ResourceMeta } from './ResourceMeta'
import { ResourceRecommendations } from './ResourceRecommendations'
import { Snippet } from '@heroui/snippet'
import { KunPatchAttribute } from '~/components/kun/PatchAttribute'
import type { PatchResourceHtml } from '~/types/api/patch'
import type { PatchResourceDetail } from '~/types/api/resource'

interface Props {
  resource: PatchResourceHtml
}

import DOMPurify from 'isomorphic-dompurify'
import { useRef } from 'react'
import { Button } from '@heroui/react'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { Download, Ban } from 'lucide-react'
import { ResourceLikeButton } from '~/components/patch/resource/ResourceLike'

interface Props {
  resource: PatchResourceHtml
}

export const ResourceDownload = ({ resource }: Props) => {
  return (
    <div className="space-y-2">
      {resource.name && !resource.note && (
        <p className="mt-2 whitespace-pre-wrap">{resource.name}</p>
      )}

      {resource.note ? (
        <div className="w-full">
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

      <div className="flex justify-between pt-2">
        <div className="flex gap-2">
          <ResourceLikeButton resource={resource} />
          <Button
            color={resource.status ? 'danger' : 'primary'}
            variant={resource.status ? 'solid' : 'flat'}
            isIconOnly
            aria-label={`下载 Galgame 补丁资源`}
          >
            {resource.status ? (
              <Ban className="size-4" />
            ) : (
              <Download className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const ResourceInfo = ({ resource }: Props) => {
  return (
    <div className="space-y-2">
      <KunPatchAttribute
        types={resource.type}
        languages={resource.language}
        platforms={resource.platform}
        modelName={resource.modelName}
        downloadCount={resource.download}
      />

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
          >
            {resource.password}
          </Snippet>
        )}
      </div>
    </div>
  )
}

interface Props {
  detail: PatchResourceDetail
}

export const KunResourceDetail = ({ detail }: Props) => {
  return (
    <div className="space-y-10">
      <PatchSummary patch={detail.patch} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <ResourceMeta resource={detail.resource} />
          <ResourceRecommendations recommendations={detail.recommendations} />
        </div>

        <Card className="col-span-2 border-default-200 border bg-content1/90 shadow-lg backdrop-blur-sm dark:bg-content1/70">
          <CardBody className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-default-900 dark:text-white">
                {detail.resource.name ||
                  `${getPreferredLanguageText(detail.patch.name)} 的补丁资源`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                该补丁资源最后更新于{' '}
                {formatDistanceToNow(detail.resource.updateTime)}
              </p>
            </div>

            <ResourceInfo resource={detail.resource} />

            <div>
              <KunUser
                user={detail.resource.user}
                userProps={{
                  name: detail.resource.user.name,
                  description: `${formatDistanceToNow(detail.resource.created)} • 已发布补丁 ${detail.resource.user.patchCount} 个`,
                  avatarProps: {
                    showFallback: true,
                    src: detail.resource.user.avatar,
                    name: detail.resource.user.name.charAt(0).toUpperCase()
                  }
                }}
              />
            </div>

            <ResourceDownload resource={detail.resource} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
