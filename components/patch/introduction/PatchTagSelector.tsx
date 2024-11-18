'use client'

import { useEffect, useState } from 'react'
import {
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  ScrollShadow
} from '@nextui-org/react'
import { Tag } from 'lucide-react'

interface PatchTag {
  id: number
  name: string
  introduction: string
  count: number
}

interface Props {
  patchId: number
  onTagsAdded?: () => void
}

export const PatchTagSelector = ({ patchId, onTagsAdded }: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [tags, setTags] = useState<PatchTag[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [existingTags, setExistingTags] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchTags()
      fetchExistingTags()
    }
  }, [isOpen, patchId])

  const fetchTags = async () => {
    const response = await fetch('/api/patch-tags')
    if (!response.ok) throw new Error('Failed to fetch tags')
    const data = await response.json()
    setTags(data.data)
  }

  const fetchExistingTags = async () => {
    const response = await fetch(`/api/patches/${patchId}/tags`)
    if (!response.ok) throw new Error('Failed to fetch existing tags')
    const data = await response.json()
    setExistingTags(data.data.map((r: any) => r.tag_id))
  }

  const handleSubmit = async () => {
    if (selectedTags.length === 0) return

    setIsLoading(true)
    setError('')

    const response = await fetch(`/api/patches/${patchId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagIds: selectedTags })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add tags')
    }

    setSelectedTags([])
    onTagsAdded?.()
    onClose()
    setIsLoading(false)
  }

  return (
    <>
      <Button
        onPress={onOpen}
        color="primary"
        variant="flat"
        startContent={<Tag size={20} />}
      >
        Add Tags
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Add Tags to Patch</ModalHeader>
          <ModalBody>
            {error && <div className="mb-4 text-sm text-danger">{error}</div>}
            <ScrollShadow className="max-h-[400px]">
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-default-100"
                  >
                    <Checkbox
                      isDisabled={existingTags.includes(tag.id)}
                      isSelected={selectedTags.includes(tag.id)}
                      onValueChange={(checked) => {
                        setSelectedTags(
                          checked
                            ? [...selectedTags, tag.id]
                            : selectedTags.filter((id) => id !== tag.id)
                        )
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tag.name}</span>
                          <Chip size="sm" variant="flat">
                            {tag.count} uses
                          </Chip>
                        </div>
                        {tag.introduction && (
                          <p className="text-small text-default-500">
                            {tag.introduction}
                          </p>
                        )}
                      </div>
                    </Checkbox>
                  </div>
                ))}
              </div>
            </ScrollShadow>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isLoading}
              isDisabled={selectedTags.length === 0}
            >
              Add Selected Tags
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
