'use client'

import { User, Chip, Button } from '@nextui-org/react'
import { Edit2, Trash2 } from 'lucide-react'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import type { AdminResource } from '~/types/api/admin'

export const RenderCell = (resource: AdminResource, columnKey: string) => {
  switch (columnKey) {
    case 'name':
      return <div className="font-medium">{resource.patchName}</div>
    case 'user':
      return (
        <User
          name={resource.user.name}
          avatarProps={{
            src: resource.user.avatar
          }}
        />
      )
    case 'storage':
      return (
        <Chip color="primary" variant="flat">
          {SUPPORTED_RESOURCE_LINK_MAP[resource.storage]}
        </Chip>
      )
    case 'size':
      return (
        <Chip size="sm" variant="flat">
          {resource.size}
        </Chip>
      )
    case 'created':
      return (
        <Chip size="sm" variant="light">
          {formatDistanceToNow(resource.created)}
        </Chip>
      )
    case 'actions':
      return (
        <div className="flex gap-2">
          <Button isIconOnly size="sm" variant="light">
            <Edit2 size={16} />
          </Button>
          <Button isIconOnly size="sm" variant="light" color="danger">
            <Trash2 size={16} />
          </Button>
        </div>
      )
    default:
      return (
        <Chip color="primary" variant="flat">
          咕咕咕
        </Chip>
      )
  }
}
