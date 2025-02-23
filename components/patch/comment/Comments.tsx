'use client'

import { useState } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { PublishComment } from './PublishComment'
import { CommentLikeButton } from './CommentLike'
import { CommentDropdown } from './CommentDropdown'
import { CommentContent } from './CommentContent'
import { scrollIntoComment } from './_scrollIntoComment'
import type { PatchComment } from '~/types/api/patch'

interface Props {
  initialComments: PatchComment[]
  id: number
  enableCommentVerify: boolean
}

export const Comments = ({
  initialComments,
  id,
  enableCommentVerify
}: Props) => {
  const [comments, setComments] = useState<PatchComment[]>(initialComments)
  const [replyTo, setReplyTo] = useState<number | null>(null)

  const setNewComment = async (newComment: PatchComment) => {
    setComments([...comments, newComment])
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
    scrollIntoComment(newComment.id)
  }

  const renderComments = (comments: PatchComment[], depth = 0) => {
    return comments.map((comment) => (
      <div key={comment.id} className={`ml-${depth * 4}`}>
        <Card id={`comment-${comment.id}`} className="border-none shadow-none">
          <CardBody className="px-0">
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <KunUser
                  user={comment.user}
                  userProps={{
                    name: comment.user.name,
                    description: formatDistanceToNow(comment.created),
                    avatarProps: {
                      showFallback: true,
                      name: comment.user.name,
                      src: comment.user.avatar
                    }
                  }}
                />
                <CommentDropdown comment={comment} setComments={setComments} />
              </div>

              <CommentContent comment={comment} />

              <div className="flex gap-2 mt-2">
                <CommentLikeButton comment={comment} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onPress={() =>
                    setReplyTo(replyTo === comment.id ? null : comment.id)
                  }
                >
                  <MessageCircle className="size-4" />
                  回复
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {replyTo === comment.id && (
          <div className="mt-2 ml-8">
            <PublishComment
              patchId={id}
              parentId={comment.id}
              receiverUsername={comment.quotedUsername}
              onSuccess={() => setReplyTo(null)}
              setNewComment={setNewComment}
              enableCommentVerify={enableCommentVerify}
            />
          </div>
        )}

        {comment.reply && comment.reply.length > 0 && (
          <div className="mt-4 ml-4">
            {renderComments(comment.reply, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-4">
      <PublishComment
        patchId={id}
        receiverUsername={null}
        setNewComment={setNewComment}
        enableCommentVerify={enableCommentVerify}
      />
      {renderComments(comments)}
    </div>
  )
}
