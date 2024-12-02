'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/button'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown'
import { MoreVertical } from 'lucide-react'
import { useUserStore } from '~/store/providers/user'
import type { AdminComment } from '~/types/api/admin'

interface Props {
  initialComment: AdminComment
}

export const CommentEdit = ({ initialComment }: Props) => {
  const [comment, setComment] = useState<AdminComment>(initialComment)
  const currentUser = useUserStore((state) => state.user)

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            isDisabled={currentUser.role < 3}
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem>编辑</DropdownItem>
          <DropdownItem className="text-danger" color="danger">
            删除
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </>
  )
}
