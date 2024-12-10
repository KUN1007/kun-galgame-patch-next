'use client'

import { Card, CardBody } from '@nextui-org/card'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import { ThumbsUp } from 'lucide-react'
import { formatDate } from '~/utils/time'
import Link from 'next/link'
import { useRouter } from 'next-nprogress-bar'
import type { PatchComment } from '~/types/api/comment'

interface Props {
  comment: PatchComment
}

export const CommentCard = ({ comment }: Props) => {
  const router = useRouter()

  return (
    <Card
      isPressable
      onPress={() => router.push(`/patch/${comment.patchId}/comment`)}
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
