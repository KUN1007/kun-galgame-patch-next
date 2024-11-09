'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Button } from '@nextui-org/button'
import { Code } from '@nextui-org/code'
import { Chip } from '@nextui-org/chip'
import { Heart, MessageSquare, MoreHorizontal, Quote } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { api } from '~/lib/trpc-client'
import { PublishComment } from './PublishComment'
import { CommentLikeButton } from './CommentLike'
import type { PatchComment } from '~/types/api/patch'

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

export const Comments = ({ id }: { id: number }) => {
  const [comments, setComments] = useState<PatchComment[]>([])
  const [replyTo, setReplyTo] = useState<number | null>(null)

  const fetchComments = async () => {
    const res = await api.patch.getPatchComments.query({
      patchId: Number(id)
    })
    setComments(res)
  }

  useEffect(() => {
    fetchComments()
  }, [id])

  const setNewComment = async (newComment: PatchComment) => {
    setComments([...comments, newComment])
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
    scrollIntoComment(newComment.id)
  }

  const renderComments = (comments: PatchComment[]) => {
    return comments.map((comment, index) => (
      <div key={comment.id}>
        <Card id={`comment-${comment.id}`} className="border-none shadow-none">
          <CardBody className="px-0">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <Avatar
                  showFallback
                  name={comment.user.name.charAt(0).toUpperCase()}
                  src={comment.user.avatar}
                />
                <span className="text-default-300">{index + 1}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="space-x-2">
                    <span className="font-semibold">{comment.user?.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(comment.created)}
                    </span>
                  </h4>
                  <Button variant="ghost" isIconOnly>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                {comment.quotedContent && (
                  <Code
                    color="primary"
                    onClick={() => scrollIntoComment(comment.parentId)}
                    className="cursor-pointer"
                  >
                    <span>{comment.quotedUsername}</span>
                    <Chip
                      endContent={<Quote className="w-4 h-4 text-blue-500" />}
                      variant="light"
                    >
                      {comment.quotedContent}
                    </Chip>
                  </Code>
                )}
                <p>{comment.content}</p>
                <div className="flex gap-2 mt-2">
                  <CommentLikeButton
                    commentId={comment.id}
                    likedBy={comment.likedBy}
                    commenter={comment.user}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onPress={() =>
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                    }
                  >
                    <MessageSquare className="w-4 h-4" />
                    回复
                  </Button>
                </div>
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
