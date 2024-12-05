import { Card, CardBody } from '@nextui-org/card'
import { ThumbsUp } from 'lucide-react'
import { formatDate } from '~/utils/time'
import Link from 'next/link'
import type { PatchComment } from '~/types/api/comment'

interface Props {
  comment: PatchComment
}

export const CommentCard = ({ comment }: Props) => {
  return (
    <Card>
      <CardBody>
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
      </CardBody>
    </Card>
  )
}
