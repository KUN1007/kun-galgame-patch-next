'use client'

import { Button, Modal, useDisclosure } from '@heroui/react'
import { WalkthroughCard } from './Card'
import { Plus } from 'lucide-react'
import { PublishWalkthrough } from './PublishWalkthrough'
import type { PatchWalkthrough } from '~/types/api/patch'
import { useState } from 'react'

interface Props {
  patchId: number
  initialWalkthroughs: PatchWalkthrough[]
}

export const Walkthrough = ({ patchId, initialWalkthroughs }: Props) => {
  const [walkthroughs, setWalkthroughs] = useState(initialWalkthroughs)

  const {
    isOpen: isOpenCreate,
    onOpen: onOpenCreate,
    onClose: onCloseCreate
  } = useDisclosure()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          color="primary"
          variant="solid"
          startContent={<Plus className="size-4" />}
          onPress={onOpenCreate}
        >
          添加攻略
        </Button>
      </div>

      <>
        {walkthroughs.map((walkthrough) => (
          <WalkthroughCard
            key={walkthrough.id}
            walkthrough={walkthrough}
            setWalkthroughs={setWalkthroughs}
          />
        ))}
      </>

      <Modal
        size="3xl"
        isOpen={isOpenCreate}
        onClose={onCloseCreate}
        scrollBehavior="outside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <PublishWalkthrough
          patchId={patchId}
          onClose={onCloseCreate}
          onSuccess={(res) => setWalkthroughs([...walkthroughs, res])}
        />
      </Modal>
    </div>
  )
}
