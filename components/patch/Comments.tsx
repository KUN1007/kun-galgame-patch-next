'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Button } from '@nextui-org/button'
import { Heart, MessageSquare, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { api } from '~/lib/trpc-client'
import { PublishComment } from './PublishComment'
import type { PatchComment } from '~/types/api/patch'

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

  return (
    <div className="space-y-4">
      <PublishComment patchId={id} onSuccess={fetchComments} />

      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardBody className="p-6">
            <div className="flex gap-4">
              <Avatar
                showFallback
                name={comment.user?.name?.charAt(0).toUpperCase()}
                src={comment.user?.avatar}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{comment.user?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(comment.created)}
                    </p>
                  </div>
                  <Button variant="ghost" isIconOnly>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <p className="mt-2">{comment.content}</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Heart className="w-4 h-4" />
                    {comment.likedBy?.length || 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onPress={() =>
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                    }
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reply
                  </Button>
                </div>

                {replyTo === comment.id && (
                  <div className="mt-4 ml-8">
                    <PublishComment
                      patchId={id}
                      parentId={comment.id}
                      onSuccess={() => {
                        setReplyTo(null)
                        fetchComments()
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
