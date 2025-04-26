'use client'

import { useState } from 'react'
import { Button, Tooltip } from '@nextui-org/react'
import { Download, Heart, Share2, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@nextui-org/modal'
import { useUserStore } from '~/store/userStore'
import { kunFetchDelete, kunFetchPut } from '~/utils/kunFetch'
import { kunCopy } from '~/utils/kunCopy'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { cn } from '~/utils/cn'
import toast from 'react-hot-toast'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderActionsProps {
  patch: Patch
}

export const PatchHeaderActions = ({ patch }: PatchHeaderActionsProps) => {
  const router = useRouter()
  const { user } = useUserStore((state) => state)
  const [favorite, setFavorite] = useState(patch.isFavorite)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleting, setDeleting] = useState(false)

  const toggleFavorite = async () => {
    if (!user.uid) {
      toast.error('请登录以收藏')
      return
    }

    setFavoriteLoading(true)
    const res = await kunFetchPut<KunResponse<boolean>>('/patch/like', {
      patchId: patch.id
    })

    setFavoriteLoading(false)
    kunErrorHandler(res, (value) => {
      setFavorite(value)
    })
  }

  const handleShareLink = () => {
    const text = `${patch.name} - ${kunMoyuMoe.domain.main}/patch/${patch.id}/introduction`
    kunCopy(text)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const res = await kunFetchDelete<KunResponse<{}>>('/patch', {
      patchId: patch.id
    })

    if (typeof res === 'string') {
      toast.error(res)
    } else {
      toast.success('删除 Galgame 成功')
      router.push('/')
    }

    onClose()
    setDeleting(false)
  }

  const handlePressDeleteButton = () => {
    if (user.uid !== patch.user.id && user.role < 4) {
      toast.error('仅游戏发布者或超级管理员可删除该游戏')
      return
    }
    onOpen()
  }

  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2">
        <Tooltip content="下载游戏补丁">
          <Button
            color="primary"
            variant="shadow"
            startContent={<Download className="size-4" />}
            onPress={() => router.push(`/patch/${patch.id}/resource`)}
            size="sm"
          >
            下载
          </Button>
        </Tooltip>

        <Tooltip content={favorite ? '取消收藏' : '收藏'}>
          <Button
            color={favorite ? 'danger' : 'default'}
            variant={favorite ? 'flat' : 'bordered'}
            isIconOnly
            size="sm"
            isLoading={favoriteLoading}
            isDisabled={favoriteLoading}
            onPress={toggleFavorite}
            aria-label={favorite ? '取消收藏' : '收藏'}
          >
            <Heart
              fill={favorite ? '#f31260' : 'none'}
              className={cn('size-4', favorite ? 'text-danger-500' : '')}
            />
          </Button>
        </Tooltip>

        <Tooltip content="复制分享链接">
          <Button
            variant="bordered"
            isIconOnly
            size="sm"
            onPress={handleShareLink}
            aria-label="复制分享链接"
          >
            <Share2 className="size-4" />
          </Button>
        </Tooltip>

        <Tooltip content="编辑游戏信息">
          <Button
            variant="bordered"
            isIconOnly
            size="sm"
            onPress={() => router.push('/edit/rewrite')}
            aria-label="编辑游戏信息"
          >
            <Pencil className="size-4" />
          </Button>
        </Tooltip>

        <Tooltip content="删除游戏">
          <Button
            variant="bordered"
            isIconOnly
            size="sm"
            onPress={handlePressDeleteButton}
            aria-label="删除游戏"
          >
            <Trash2 className="size-4" />
          </Button>
        </Tooltip>
      </div>

      <p className="text-xs text-default-500">
        收藏后, 有新补丁资源发布时, 您将收到通知
      </p>

      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            永久删除 Galgame
          </ModalHeader>
          <ModalBody>
            严重警告, 删除 Galgame 将会删除这个 Galgame 下面所有的评论,
            所有的资源链接, 所有的贡献历史记录, 您确定要删除吗
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isDisabled={deleting}
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
