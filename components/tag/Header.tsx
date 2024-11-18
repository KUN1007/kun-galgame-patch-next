'use client'

import { CardHeader } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import { useDisclosure } from '@nextui-org/modal'
import { Plus, Tag } from 'lucide-react'
import { CreateTagModal } from '~/components/tag/CreateTagModal'
import type { Tag as TagType } from '~/types/api/tag'

interface Props {
  setNewTag: (tag: TagType) => void
}

export const TagHeader = ({ setNewTag }: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <CardHeader className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Tag className="w-6 h-6" />
          <h1 className="text-2xl font-bold">标签列表</h1>
        </div>
        <Button
          color="primary"
          onPress={onOpen}
          startContent={<Plus size={20} />}
        >
          创建标签
        </Button>
      </CardHeader>

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
