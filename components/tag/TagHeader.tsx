'use client'

import { Button } from '@nextui-org/button'
import { useDisclosure } from '@nextui-org/modal'
import { Plus } from 'lucide-react'
import { CreateTagModal } from '~/components/tag/CreateTagModal'
import { KunHeader } from '../kun/Header'
import type { Tag as TagType } from '~/types/api/tag'

interface Props {
  setNewTag: (tag: TagType) => void
}

export const TagHeader = ({ setNewTag }: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <KunHeader
        name="标签列表"
        description="这里是补丁中的所有标签"
        headerEndContent={
          <Button
            color="primary"
            onPress={onOpen}
            startContent={<Plus size={20} />}
          >
            创建标签
          </Button>
        }
      />

      <CreateTagModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={(newTag) => {
          setNewTag(newTag)
          onClose()
        }}
      />
    </>
  )
}
