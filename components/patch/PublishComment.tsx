'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Button } from '@nextui-org/button'
import { Textarea } from '@nextui-org/input'
import { Send } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import toast from 'react-hot-toast'
import { patchCommentSchema } from '~/validations/patch'
import { useUserStore } from '~/store/userStore'

const commentSchema = patchCommentSchema.pick({ content: true })

interface CreateCommentProps {
  patchId: number
  parentId?: number | null
  receiver: string | null | undefined
  onSuccess?: () => void
}

type CommentFormData = z.infer<typeof commentSchema>

export const PublishComment = ({
  patchId,
  parentId = null,
  receiver = null,
  onSuccess
}: CreateCommentProps) => {
  const [loading, setLoading] = useState(false)
  const { user } = useUserStore()

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
    await api.patch.publishPatchComment.mutate({
      patchId,
      parentId,
      content: data.content.trim()
    })
    setLoading(false)

    toast.success('评论发布成功')
    reset()
    onSuccess?.()
  }

  return (
    <Card>
      <CardHeader className="pb-0 space-x-4">
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
              startContent={<Send className="w-4 h-4" />}
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
