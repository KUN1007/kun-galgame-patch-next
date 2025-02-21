'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  useDisclosure
} from '@nextui-org/react'
import { Send } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { useUserStore } from '~/store/providers/user'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import { MilkdownProvider } from '@milkdown/react'
import { KunEditor } from '~/components/kun/milkdown/Editor'
import { Markdown } from '~/components/kun/icons/Markdown'
import { useKunMilkdownStore } from '~/store/milkdownStore'
import { KunCaptchaModal } from '~/components/kun/auth/CaptchaModal'
import type { PatchComment } from '~/types/api/patch'

interface CreateCommentProps {
  patchId: number
  receiver: string | null | undefined
  parentId?: number | null
  setNewComment: (newComment: PatchComment) => void
  onSuccess?: () => void
  enableCommentVerify: boolean
}

export const PublishComment = ({
  patchId,
  parentId = null,
  receiver = null,
  setNewComment,
  onSuccess,
  enableCommentVerify
}: CreateCommentProps) => {
  const [loading, setLoading] = useState(false)
  const { user } = useUserStore((state) => state)
  const refreshMilkdownContent = useKunMilkdownStore(
    (state) => state.refreshMilkdownContent
  )
  const [content, setContent] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handlePublishComment = async (code?: string) => {
    setLoading(true)
    const res = await kunFetchPost<KunResponse<PatchComment>>(
      '/patch/comment',
      {
        patchId,
        parentId,
        content: content.trim(),
        captcha: code ?? ''
      }
    )
    kunErrorHandler(res, (value) => {
      setNewComment({
        ...value,
        user: { id: user.uid, name: user.name, avatar: user.avatar }
      })
      toast.success('评论发布成功')
      setContent('')
      refreshMilkdownContent()
      onSuccess?.()
      onClose()
    })

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="pb-0 space-x-4">
        <KunAvatar
          uid={user.uid}
          avatarProps={{
            showFallback: true,
            name: user.name,
            src: user.avatar
          }}
        />
        <div className="flex flex-col">
          <span className="font-semibold">{user.name}</span>
          {receiver && <span className="text-sm">回复 @{receiver}</span>}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <MilkdownProvider>
          <KunEditor valueMarkdown={content} saveMarkdown={setContent} />
        </MilkdownProvider>

        <div className="flex items-center justify-between">
          <Chip
            variant="light"
            color="secondary"
            size="sm"
            endContent={<Markdown />}
            className="select-none"
          >
            评论支持 Markdown
          </Chip>

          <Button
            color="primary"
            startContent={<Send className="size-4" />}
            isDisabled={!content.trim() || loading}
            isLoading={loading}
            onPress={() => {
              if (enableCommentVerify) {
                onOpen()
              } else {
                handlePublishComment()
              }
            }}
          >
            发布评论
          </Button>
        </div>
      </CardBody>

      <KunCaptchaModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handlePublishComment}
        hint="由于近日网站被频繁攻击, 因此您发送评论需要进行人机验证, 为您添麻烦了！ 非常对不起！"
      />
    </Card>
  )
}
