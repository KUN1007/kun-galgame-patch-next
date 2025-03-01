'use client'

import { useState } from 'react'
import { Accordion, AccordionItem, Button } from '@nextui-org/react'
import { KunUser } from '~/components/kun/floating-card/KunUser'
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
    <div className="space-y-2">
      {resource.name && !resource.note && (
        <p className="mt-2 whitespace-pre-wrap">{resource.name}</p>
      )}

      {resource.note && resource.name ? (
        <Accordion
          fullWidth={true}
          className="p-0"
          itemClasses={{
            base: 'p-0 w-full',
            title: 'font-normal text-medium',
            trigger: 'p-0 flex items-center',
            indicator: 'text-medium',
            content: 'text-small px-2 whitespace-pre-wrap'
          }}
        >
          <AccordionItem
            key="1"
            aria-label="资源备注"
            subtitle="点击查看备注"
            title={resource.name ? resource.name : '资源备注'}
          >
            {resource.note}
          </AccordionItem>
        </Accordion>
      ) : (
        <p className="mt-2 whitespace-pre-wrap">{resource.note}</p>
      )}

      <div className="flex justify-between">
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
            color="primary"
            variant="flat"
            isIconOnly
            aria-label={`下载 Galgame 补丁资源`}
            onPress={() => toggleLinks(resource.id)}
          >
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      {showLinks[resource.id] && <ResourceDownloadCard resource={resource} />}
    </div>
  )
}
