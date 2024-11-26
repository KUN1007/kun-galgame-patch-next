'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/button'
import { User } from '@nextui-org/user'
import { Download } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { ResourceLikeButton } from './ResourceLike'
import { ResourceDownloadCard } from './DownloadCard'
import type { PatchResource } from '~/types/api/patch'

interface Props {
  resource: PatchResource
}

export const ResourceDownload = ({ resource }: Props) => {
  const [showLinks, setShowLinks] = useState<Record<number, boolean>>({})

  const toggleLinks = (resourceId: number) => {
    setShowLinks((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <User
          name={resource.user.name}
          description={`${formatDistanceToNow(resource.created)} • 已发布补丁 ${resource.user.patchCount} 个`}
          avatarProps={{
            showFallback: true,
            src: resource.user.avatar,
            name: resource.user.name.charAt(0).toUpperCase()
          }}
        />

        <div className="flex gap-2">
          <ResourceLikeButton
            resourceId={resource.id}
            likedBy={resource.likedBy}
            publisher={resource.user}
          />
          <Button
            color="primary"
            variant="flat"
            isIconOnly
            onPress={() => toggleLinks(resource.id)}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showLinks[resource.id] && <ResourceDownloadCard resource={resource} />}
    </div>
  )
}
