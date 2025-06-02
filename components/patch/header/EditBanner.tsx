'use client'

import { Button } from '@heroui/button'
import { Modal, ModalContent, ModalHeader, useDisclosure } from '@heroui/modal'
import { RewritePatchBanner } from '~/components/edit/rewrite/RewritePatchBanner'
import { useUserStore } from '~/store/userStore'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderBannerProps {
  patch: Patch
}

export const EditBanner = ({ patch }: PatchHeaderBannerProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user } = useUserStore((state) => state)

  return (
    <>
      {(user.uid === patch.user.id || user.role > 2) && (
        <Button
          color="default"
          variant="shadow"
          size="sm"
          className="absolute z-10 bottom-3 left-3 backdrop-blur-sm bg-background/40"
          onPress={onOpen}
        >
          更改图片
        </Button>
      )}

      {/* Edit modal */}
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
