'use client'

import {
  Card,
  CardBody,
  Button,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/react'
import { MoreVertical, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '~/utils/time'

const comments = [
  {
    id: 1,
    user: {
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=1'
    },
    content: 'This is a great patch! Thanks for sharing.',
    patch: 'Sample Patch 1',
    likes: 15,
    created: '2024-03-10T10:00:00'
  },
  {
    id: 2,
    user: {
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=2'
    },
    content: 'Having some issues with installation. Can someone help?',
    patch: 'Sample Patch 2',
    likes: 3,
    created: '2024-03-09T15:30:00'
  }
]

export default function CommentsPage() {
  const [page, setPage] = useState(1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Comments Management</h1>

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{comment.user.name}</h3>
                      <span className="text-small text-default-500">
                        commented on {comment.patch}
                      </span>
                    </div>
                    <p className="mt-1">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-small text-default-500">
                        <ThumbsUp size={14} />
                        {comment.likes}
                      </div>
                      <span className="text-small text-default-500">
                        {formatDate(comment.created, {
                          isPrecise: true,
                          isShowYear: true
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem>Edit</DropdownItem>
                    <DropdownItem className="text-danger" color="danger">
                      Delete
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Pagination
          total={10}
          page={page}
          onChange={setPage}
          color="primary"
          showControls
        />
      </div>
    </div>
  )
}
