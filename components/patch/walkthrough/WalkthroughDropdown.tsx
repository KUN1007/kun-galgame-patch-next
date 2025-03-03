'use client'

import { SetStateAction, useState } from 'react'
import { Button } from '@nextui-org/button'
import { Dropdown, DropdownMenu, DropdownTrigger } from '@nextui-org/dropdown'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { DropdownItem } from '@nextui-org/dropdown'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@nextui-org/modal'
import { Input } from '@nextui-org/input'
import { kunFetchDelete, kunFetchPut } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { useUserStore } from '~/store/providers/user'
import { KunEditor } from '~/components/kun/milkdown/Editor'
import { markdownToText } from '~/utils/markdownToText'
import type { PatchWalkthrough } from '~/types/api/patch'

interface Props {
  walkthrough: PatchWalkthrough
  setWalkthroughs: (walkthroughs: SetStateAction<PatchWalkthrough[]>) => void
}

export const WalkthroughDropdown = ({
  walkthrough,
  setWalkthroughs
}: Props) => {
  const { user } = useUserStore((state) => state)
  const [name, setName] = useState(walkthrough.name)
  const [content, setContent] = useState(walkthrough.markdown)
  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit
  } = useDisclosure()

  const [updating, setUpdating] = useState(false)
  const handleUpdateWalkthrough = async (walkthroughId: number) => {
    if (!name.trim() || !content.trim()) {
      toast.error('攻略标题或内容不可为空')
      return
    }

    setUpdating(true)
    const res = await kunFetchPut<KunResponse<PatchWalkthrough>>(
      '/patch/walkthrough',
      {
        walkthroughId,
        name: name.trim(),
        content: content.trim()
      }
    )
    kunErrorHandler(res, () => {
      setContent('')
      setWalkthroughs((prev) =>
        prev.map((walkthrough) =>
          walkthrough.id === walkthroughId
            ? { ...walkthrough, name }
            : walkthrough
        )
      )
      setName('')
      setContent('')
      onCloseEdit()
      toast.success('更新攻略成功!')
    })
    setUpdating(false)
  }

  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete
  } = useDisclosure()
  const [deleting, setDeleting] = useState(false)
  const handleDeleteWalkthrough = async () => {
    setDeleting(true)
    const res = await kunFetchDelete<KunResponse<{}>>('/patch/walkthrough', {
      walkthroughId: walkthrough.id
    })
    kunErrorHandler(res, () => {
      onCloseDelete()
      setWalkthroughs((prev) => prev.filter((com) => com.id !== walkthrough.id))
      toast.success('攻略删除成功')
    })
    setDeleting(false)
  }

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button variant="light" isIconOnly className="text-default-400">
            <MoreHorizontal aria-label="Galgame 攻略操作" className="size-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Walkthrough actions"
          disabledKeys={
            user.uid === walkthrough.user.id ? [] : ['edit', 'delete']
          }
        >
          <DropdownItem
            key="edit"
            color="default"
            startContent={<Pencil className="size-4" />}
            onPress={onOpenEdit}
          >
            编辑攻略
          </DropdownItem>
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            startContent={<Trash2 className="size-4" />}
            onPress={() => {
              onOpenDelete()
            }}
          >
            删除攻略
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Modal
        size="3xl"
        isOpen={isOpenEdit}
        onClose={onCloseEdit}
        scrollBehavior="outside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            重新编辑攻略
          </ModalHeader>
          <ModalBody>
            <form className="space-y-6">
              <Input
                placeholder="请填写游戏攻略的名字, 例如 (糖调全线路攻略)"
                isRequired
                value={name}
                onValueChange={setName}
              />

              <KunEditor valueMarkdown={content} saveMarkdown={setContent} />
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseEdit}>
              取消
            </Button>
            <Button
              color="primary"
              onPress={() => handleUpdateWalkthrough(walkthrough.id)}
              isDisabled={updating}
              isLoading={updating}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenDelete} onClose={onCloseDelete} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">删除攻略</ModalHeader>
          <ModalBody>
            <p>您确定要删除这条攻略吗, 该操作不可撤销</p>
            <p className="pl-4 border-l-4 border-primary-500">
              {markdownToText(walkthrough.markdown)}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseDelete}>
              取消
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteWalkthrough}
              disabled={deleting}
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
