'use client'

import { useState } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import { Code } from '@nextui-org/code'
import { Chip } from '@nextui-org/chip'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { MessageCircle, Quote } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { PublishComment } from './PublishComment'
import { CommentLikeButton } from './CommentLike'
import { CommentDropdown } from './CommentDropdown'
import type { PatchComment } from '~/types/api/patch'

interface Props {
  initialComments: PatchComment[]
  id: number
}

const scrollIntoComment = (id: number | null) => {
  if (id === null) {
    return
  }

  const targetComment = document.getElementById(`comment-${id}`)
  if (targetComment) {
    targetComment.scrollIntoView({ behavior: 'smooth', block: 'center' })
    targetComment.classList.add('bg-default-100')
    targetComment.classList.add('px-2')
    setTimeout(() => {
      targetComment.classList.remove('bg-default-100')
      targetComment.classList.remove('px-2')
    }, 2000)
  }
}

export const Comments = ({ initialComments, id }: Props) => {
  const [comments, setComments] = useState<PatchComment[]>(initialComments)
  const [replyTo, setReplyTo] = useState<number | null>(null)

  const setNewComment = async (newComment: PatchComment) => {
    setComments([...comments, newComment])
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
    scrollIntoComment(newComment.id)
  }

  const renderComments = (comments: PatchComment[]) => {
    return comments.map((comment) => (
      <div key={comment.id}>
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

              {comment.quotedContent && (
                <Code
                  color="primary"
                  onClick={() => scrollIntoComment(comment.parentId)}
                  className="cursor-pointer"
                >
                  <span>{comment.quotedUsername}</span>
                  <Chip
                    endContent={<Quote className="text-blue-500 size-4" />}
                    variant="light"
                  >
                    {comment.quotedContent}
                  </Chip>
                </Code>
              )}

              <p>{comment.content}</p>

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
              receiver={comment.quotedUsername}
              onSuccess={() => setReplyTo(null)}
              setNewComment={setNewComment}
            />
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-4">
      <PublishComment
        patchId={id}
        receiver={null}
        setNewComment={setNewComment}
      />
      {renderComments(comments)}
    </div>
  )
}
