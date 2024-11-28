import { Card, CardBody } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown'
import { MoreVertical, ThumbsUp } from 'lucide-react'
import { formatDate } from '~/utils/time'
import Link from 'next/link'
import type { AdminComment } from '~/types/api/admin'

interface Props {
  comment: AdminComment
}

export const CommentCard = ({ comment }: Props) => {
  return (
    <Card>
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
                  评论在{' '}
                  <Link
                    className="text-primary-500"
                    href={`/patch/${comment.patchId}/comment`}
                  >
                    {comment.patchName}
                  </Link>
                </span>
              </div>
              <p className="mt-1">{comment.content}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-small text-default-500">
                  <ThumbsUp size={14} />
                  {comment.like}
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
              <DropdownItem>编辑</DropdownItem>
              <DropdownItem className="text-danger" color="danger">
                删除
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardBody>
    </Card>
  )
}
