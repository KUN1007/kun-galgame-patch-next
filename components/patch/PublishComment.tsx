'use client'

import { useState } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import { Textarea } from '@nextui-org/input'
import { Send } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import toast from 'react-hot-toast'

interface CreateCommentProps {
  patchId: number
  parentId?: number | null
  onSuccess?: () => void
}

export const PublishComment = ({
  patchId,
  parentId = null,
  onSuccess
}: CreateCommentProps) => {
  const [content, setContent] = useState('')

  const handleSubmit = async () => {
    // await api.patch.createPatchComment.mutate({
    //   patchId,
    //   parentId,
    //   content: content.trim()
    // })

    toast.success('评论发布成功')

    setContent('')
    onSuccess?.()
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <Textarea
          label="评论"
          placeholder="Write your comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          minRows={3}
        />
        <div className="flex justify-end">
          <Button
            color="primary"
            startContent={<Send className="w-4 h-4" />}
            onPress={handleSubmit}
            isDisabled={!content.trim()}
          >
            发布评论
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
