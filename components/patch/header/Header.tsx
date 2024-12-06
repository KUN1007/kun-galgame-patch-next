'use client'

import { Button } from '@nextui-org/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  useDisclosure
} from '@nextui-org/modal'
import { RewritePatchBanner } from '~/components/edit/rewrite/RewritePatchBanner'
import { useUserStore } from '~/store/providers/user'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
}

export const PatchHeader = ({ patch }: PatchHeaderProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user } = useUserStore((state) => state)

  return (
    <>
      {user.uid === patch.user.id && (
        <Button
          color="secondary"
          variant="bordered"
          size="sm"
          className="absolute right-2 top-2"
          onClick={onOpen}
        >
          更改图片
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            更改预览图片
          </ModalHeader>
          <RewritePatchBanner patchId={patch.id} onClose={onClose} />
        </ModalContent>
      </Modal>
    </>
  )
}
