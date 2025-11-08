'use client'

import DOMPurify from 'isomorphic-dompurify'
import { useState, useRef, useLayoutEffect } from 'react'
import { Button } from '@heroui/react'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { Download, ChevronDown, ChevronUp, Ban } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { ResourceLikeButton } from './ResourceLike'
import { ResourceDownloadCard } from './DownloadCard'
import toast from 'react-hot-toast'
import type { PatchResourceHtml } from '~/types/api/patch'

interface Props {
  resource: PatchResourceHtml
}

const COLLAPSED_HEIGHT_PX = 96

export const ResourceDownload = ({ resource }: Props) => {
  const [showLinks, setShowLinks] = useState<Record<number, boolean>>({})
  const [isNoteExpanded, setIsNoteExpanded] = useState(false)
  const [isNoteOverflowing, setIsNoteOverflowing] = useState(false)
  const noteContentRef = useRef<HTMLDivElement>(null)

  const toggleLinks = (resource: PatchResourceHtml) => {
    if (resource.status) {
      toast.error(
        '这个补丁资源因为可能含有病毒, 或者其它原因, 已被补丁作者或管理员禁止下载, 请等待我们的处理'
      )
      return
    }

    const resourceId = resource.id
    setShowLinks((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId]
    }))
  }

  useLayoutEffect(() => {
    const element = noteContentRef.current
    if (element) {
      if (element.scrollHeight > COLLAPSED_HEIGHT_PX) {
        setIsNoteOverflowing(true)
      } else {
        setIsNoteOverflowing(false)
      }
    }
  }, [resource.noteHtml])

  return (
    <div className="space-y-2">
      {resource.name && !resource.note && (
        <p className="mt-2 whitespace-pre-wrap">{resource.name}</p>
      )}

      {resource.note ? (
        <div className="w-full">
          <div className="flex flex-col">
            <h3 className="font-medium">
              {resource.name ? resource.name : '资源备注'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              该补丁资源最后更新于 {formatDistanceToNow(resource.updateTime)}
            </p>
          </div>

          <div className="relative mt-2">
            <div
              ref={noteContentRef}
              className={`kun-prose max-w-none overflow-hidden transition-all duration-300 ease-in-out`}
              style={{
                maxHeight: isNoteExpanded ? '' : `${COLLAPSED_HEIGHT_PX}px`
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(resource.noteHtml)
                }}
              />
            </div>
          </div>

          {isNoteOverflowing && (
            <Button
              variant="light"
              color="primary"
              className="mt-1 px-2 py-1 text-sm"
              onPress={() => setIsNoteExpanded(!isNoteExpanded)}
            >
              {isNoteExpanded ? (
                <>
                  <ChevronUp className="mr-1 size-4" />
                  收起备注
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 size-4" />
                  展开全部备注
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <p>{resource.name}</p>
      )}

      <div className="flex justify-between pt-2">
        <KunUser
          user={resource.user}
          userProps={{
            name: resource.user.name,
            description: `${formatDistanceToNow(resource.created)} • 已发布补丁 ${resource.user.patchCount} 个`,
            avatarProps: {
              showFallback: true,
              src: resource.user.avatar,
              name: resource.user.name.charAt(0).toUpperCase()
            }
          }}
        />

        <div className="flex gap-2">
          <ResourceLikeButton resource={resource} />
          <Button
            color={resource.status ? 'danger' : 'primary'}
            variant={resource.status ? 'solid' : 'flat'}
            isIconOnly
            aria-label={`下载 Galgame 补丁资源`}
            onPress={() => toggleLinks(resource)}
          >
            {resource.status ? (
              <Ban className="size-4" />
            ) : (
              <Download className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {showLinks[resource.id] && <ResourceDownloadCard resource={resource} />}
    </div>
  )
}
