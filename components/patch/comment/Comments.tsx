'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Pagination } from '@heroui/pagination'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { PublishComment } from './PublishComment'
import { CommentLikeButton } from './CommentLike'
import { CommentDropdown } from './CommentDropdown'
import { CommentContent } from './CommentContent'
import { scrollIntoComment } from './_scrollIntoComment'
import { cn } from '~/utils/cn'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunLoading } from '~/components/kun/Loading'
import { useMounted } from '~/hooks/useMounted'
import type { PatchComment } from '~/types/api/patch'

interface Props {
  initialComments: PatchComment[]
  total: number
  id: number
  enableCommentVerify: boolean
}

export const Comments = ({
  initialComments,
  total,
  id,
  enableCommentVerify
}: Props) => {
  const [comments, setComments] = useState<PatchComment[]>(initialComments)
  const [totalCount, setTotalCount] = useState<number>(total)
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const isMounted = useMounted()

  const setNewComment = async (newComment: PatchComment) => {
    setComments([...comments, newComment])
    setTotalCount((prev) => prev + 1)
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
    scrollIntoComment(newComment.id)
  }

  const fetchComments = async () => {
    setLoading(true)
    const res = await kunFetchGet<{
      comments: PatchComment[]
      total: number
    }>('/patch/comment', {
      patchId: id,
      page,
      limit: 30
    })
    setComments(res.comments)
    setTotalCount(res.total)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchComments()
  }, [page])

  return (
    <div className="space-y-4">
      <PublishComment
        patchId={id}
        receiverUsername={null}
        setNewComment={setNewComment}
        enableCommentVerify={enableCommentVerify}
      />

      {loading ? (
        <KunLoading hint="正在加载评论..." />
      ) : (
        <>
          {comments.map((comment) => (
            <div key={comment.id} className={cn('ml-0', 'space-y-4')}>
              <Card id={`comment-${comment.id}`}>
                <CardBody>
                  <div className="space-y-2">
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
                      <CommentDropdown
                        comment={comment}
                        setComments={setComments}
                      />
                    </div>

                    {comment.quotedUsername && (
                      <div className="text-sm text-default-500">
                        {comment.user.name} 回复了 {comment.quotedUsername}
                      </div>
                    )}

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
            </div>
          ))}
        </>
      )}

      {totalCount > 30 && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(totalCount / 30)}
            page={page}
            onChange={(newPage: number) => setPage(newPage)}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </div>
  )
}
