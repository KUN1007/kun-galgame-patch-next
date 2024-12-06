'use client'

import { useState } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Button } from '@nextui-org/button'
import { Code } from '@nextui-org/code'
import { Chip } from '@nextui-org/chip'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@nextui-org/dropdown'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@nextui-org/modal'
import { Textarea } from '@nextui-org/input'
import {
  Check,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Quote,
  Trash2,
  X
} from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { kunFetchDelete, kunFetchPut } from '~/utils/kunFetch'
import { PublishComment } from './PublishComment'
import { CommentLikeButton } from './CommentLike'
import toast from 'react-hot-toast'
import { useUserStore } from '~/store/providers/user'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
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

  const [deleteCommentId, setDeleteCommentId] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user } = useUserStore((state) => state)
  const [deleting, setDeleting] = useState(false)
  const handleDeleteComment = async () => {
    setDeleting(true)
    const res = await kunFetchDelete<KunResponse<{}>>('/patch/comment', {
      commentId: deleteCommentId
    })
    kunErrorHandler(res, () => {
      setComments((prev) =>
        prev.filter((comment) => comment.id !== deleteCommentId)
      )
      setDeleteCommentId(0)
      onClose()
      toast.success('评论删除成功')
    })
    setDeleting(false)
  }

  const [editingComment, setEditingComment] = useState<number>(0)
  const [editContent, setEditContent] = useState('')
  const [updating, setUpdating] = useState(false)
  const startEditing = (comment: PatchComment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }
  const cancelEditing = () => {
    setEditingComment(0)
    setEditContent('')
  }
  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) {
      toast.error('评论内容不可为空')
      return
    }

    setUpdating(true)
    const res = await kunFetchPut<KunResponse<PatchComment>>('/patch/comment', {
      commentId,
      content: editContent.trim()
    })
    kunErrorHandler(res, () => {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, content: editContent }
            : comment
        )
      )
      cancelEditing()
      toast.success('更新评论成功!')
    })

    setUpdating(false)
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
                    <span className="text-muted-foreground text-sm">
                      {formatDistanceToNow(comment.created)}
                    </span>
                  </h4>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="light"
                        isIconOnly
                        className="text-default-400"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Comment actions"
                      disabledKeys={
                        user.uid === comment.userId ? [] : ['edit', 'delete']
                      }
                    >
                      <DropdownItem
                        key="edit"
                        color="default"
                        startContent={<Pencil className="size-4" />}
                        onPress={() => startEditing(comment)}
                      >
                        编辑评论
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        startContent={<Trash2 className="size-4" />}
                        onPress={() => {
                          setDeleteCommentId(comment.id)
                          onOpen()
                        }}
                      >
                        删除评论
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                {comment.quotedContent && (
                  <Code
                    color="primary"
                    onClick={() => scrollIntoComment(comment.parentId)}
                    className="cursor-pointer"
                  >
                    <span>{comment.quotedUsername}</span>
                    <Chip
                      endContent={<Quote className="size-4 text-blue-500" />}
                      variant="light"
                    >
                      {comment.quotedContent}
                    </Chip>
                  </Code>
                )}

                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      minRows={2}
                      maxRows={8}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        startContent={<Check className="size-4" />}
                        onPress={() => handleUpdateComment(comment.id)}
                        disabled={updating}
                        isLoading={updating}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        startContent={<X className="size-4" />}
                        onPress={cancelEditing}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p>{comment.content}</p>
                )}

                <div className="mt-2 flex gap-2">
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
            </div>
          </CardBody>
        </Card>

        {replyTo === comment.id && (
          <div className="ml-8 mt-2">
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

      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">删除评论</ModalHeader>
          <ModalBody>
            <p>
              您确定要删除这条评论吗, 这将会删除该评论,
              以及所有回复该评论的评论, 该操作不可撤销
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteComment}
              disabled={deleting}
              isLoading={deleting}
            >
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
