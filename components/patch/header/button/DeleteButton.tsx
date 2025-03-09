'use client'

import { useState } from 'react'
import { kunFetchDelete } from '~/utils/kunFetch'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@nextui-org/modal'
import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { Trash2 } from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import toast from 'react-hot-toast'
import { useRouter } from 'next-nprogress-bar'
import type { Patch } from '~/types/api/patch'

interface Props {
  patch: Patch
}

export const DeleteButton = ({ patch }: Props) => {
  const { user } = useUserStore((state) => state)
  const router = useRouter()

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleting, setDeleting] = useState(false)
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
    <>
      <Tooltip color="default" content="删除游戏">
        <Button
          isIconOnly
          variant="bordered"
          onPress={handlePressDeleteButton}
          className="min-w-0 px-2"
          aria-label="删除游戏"
        >
          <Trash2 className="size-4" />
        </Button>
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose}>
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
    </>
  )
}
