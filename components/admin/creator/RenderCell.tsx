'use client'

import { Chip, User } from '@nextui-org/react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { APPLICANT_STATUS_MAP } from '~/constants/admin'
import { ActionButton } from './ActionButton'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import type { AdminCreator } from '~/types/api/admin'

interface RenderCellProps {
  creator: AdminCreator
  columnKey: string
}

const getStatusColor = (status: number) => {
  switch (status) {
    case 2:
      return 'success'
    case 3:
      return 'danger'
    default:
      return 'warning'
  }
}

export const RenderCell = ({ creator, columnKey }: RenderCellProps) => {
  switch (columnKey) {
    case 'sender':
      return (
        <>
          {creator.sender && (
            <KunUser
              user={creator.sender}
              userProps={{
                name: creator.sender.name,
                description: `已发布 ${creator.patchResourceCount} 个补丁资源`,
                avatarProps: {
                  src: creator.sender?.avatar
                }
              }}
            />
          )}
        </>
      )
    case 'status':
      return (
        <Chip color={getStatusColor(creator.status)} variant="flat" size="sm">
          {APPLICANT_STATUS_MAP[creator.status]}
        </Chip>
      )
    case 'created':
      return formatDistanceToNow(creator.created)
    case 'actions':
      return creator.status === 0 ? (
        <ActionButton creator={creator} />
      ) : (
        <Chip variant="flat" color="success">
          已处理
        </Chip>
      )
    default:
      return null
  }
}
