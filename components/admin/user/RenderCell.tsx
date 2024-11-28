'use client'

import { User, Chip, Button } from '@nextui-org/react'
import { Edit2, Trash2 } from 'lucide-react'
import {
  getUserRole,
  getUserStatus,
  getUserStatusColor
} from '~/constants/user'
import type { AdminUser as AdminUserType } from '~/types/api/admin'

export const RenderCell = (user: AdminUserType, columnKey: string) => {
  switch (columnKey) {
    case 'user':
      return (
        <User
          name={user.name}
          description={`补丁数 - ${user._count.patch} | 资源数 - ${user._count.patch_resource}`}
          avatarProps={{
            src: user.avatar
          }}
        />
      )
    case 'role':
      return (
        <Chip color="primary" variant="flat">
          {getUserRole(user.role)}
        </Chip>
      )
    case 'status':
      return (
        <Chip color={getUserStatusColor(user.status)} variant="flat">
          {getUserStatus(user.status)}
        </Chip>
      )
    case 'actions':
      return (
        <div className="flex gap-2">
          <Button isIconOnly size="sm" variant="light">
            <Edit2 size={16} />
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
