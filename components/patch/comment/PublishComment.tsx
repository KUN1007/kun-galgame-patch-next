'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Button } from '@nextui-org/button'
import { Textarea } from '@nextui-org/input'
import { Send } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { patchCommentCreateSchema } from '~/validations/patch'
import { useUserStore } from '~/store/providers/user'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import type { PatchComment } from '~/types/api/patch'

const commentSchema = patchCommentCreateSchema.pick({ content: true })

interface CreateCommentProps {
  patchId: number
  receiver: string | null | undefined
  parentId?: number | null
  setNewComment: (newComment: PatchComment) => void
  onSuccess?: () => void
}

type CommentFormData = z.infer<typeof commentSchema>

export const PublishComment = ({
  patchId,
  parentId = null,
  receiver = null,
  setNewComment,
  onSuccess
}: CreateCommentProps) => {
  const [loading, setLoading] = useState(false)
  const { user } = useUserStore((state) => state)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: ''
    }
  })

  const onSubmit = async (data: CommentFormData) => {
    setLoading(true)
    const res = await kunFetchPost<KunResponse<PatchComment>>(
      '/patch/comment',
      {
        patchId,
        parentId,
        content: data.content.trim()
      }
    )
    kunErrorHandler(res, (value) => {
      setNewComment({
        ...value,
        user: { id: user.uid, name: user.name, avatar: user.avatar }
      })
      toast.success('评论发布成功')
      reset()
      onSuccess?.()
    })

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="space-x-4 pb-0">
        <Avatar
          showFallback
          name={user.name.charAt(0).toUpperCase()}
          src={user.avatar}
        />
        <div className="flex flex-col">
          <span className="font-semibold">{user.name}</span>
          {receiver && <span className="text-sm">回复 @{receiver}</span>}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Write your comment..."
                minRows={3}
                isInvalid={!!errors.content}
                errorMessage={errors.content?.message}
              />
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              color="primary"
              startContent={<Send className="size-4" />}
              isDisabled={!watch().content.trim() || loading}
              isLoading={loading}
            >
              发布评论
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
