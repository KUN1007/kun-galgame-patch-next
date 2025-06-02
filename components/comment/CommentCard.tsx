import { Card, CardBody } from '@heroui/card'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import { ThumbsUp } from 'lucide-react'
import { formatDate } from '~/utils/time'
import Link from 'next/link'
import type { PatchComment } from '~/types/api/comment'

interface Props {
  comment: PatchComment
}

export const CommentCard = ({ comment }: Props) => {
  return (
    <Card
      isPressable
      as={Link}
      href={`/patch/${comment.patchId}/comment`}
      className="w-full"
    >
      <CardBody>
        <div className="flex gap-4">
          <KunAvatar
            uid={comment.user.id}
            avatarProps={{
              name: comment.user.name,
              src: comment.user.avatar
            }}
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{comment.user.name}</h2>
              <span className="text-small text-default-500">
                评论在{' '}
                <span className="text-primary-500">{comment.patchName}</span>
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
      </CardBody>
    </Card>
  )
}
