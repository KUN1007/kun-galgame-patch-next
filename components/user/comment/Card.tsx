'use client'

import { Card, CardBody } from '@nextui-org/card'
import { Chip } from '@nextui-org/chip'
import { Link } from '@nextui-org/link'
import { Tooltip } from '@nextui-org/tooltip'
import { Heart } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import type { UserComment } from '~/types/api/user'

interface Props {
  comment: UserComment
}

export const UserCommentCard = ({ comment }: Props) => {
  return (
    <Card>
      <CardBody className="space-y-2">
        {comment.quotedUserUid && (
          <h4 className="space-x-2">
            <span className="text-default-500">回复给</span>
            <Link href={`/user/${comment.quotedUserUid}/resource`}>
              {comment.quotedUsername}
            </Link>
          </h4>
        )}

        <p>{comment.content}</p>

        <div className="flex items-center justify-between text-default-500">
          <span className="text-sm text-muted-foreground">
            发布于 {formatDistanceToNow(comment.created)}
          </span>

          <Tooltip content="点赞数">
            <Chip
              startContent={<Heart className="w-4 h-4" />}
              variant="light"
              size="sm"
              className="gap-2 text-default-500"
            >
              {comment.like}
            </Chip>
          </Tooltip>
        </div>

        <div className="text-sm text-default-500">
          位置{' '}
          <Link
            size="sm"
            underline="always"
            href={`/patch/${comment.patchId}/comment`}
          >
            {comment.patchName}
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
