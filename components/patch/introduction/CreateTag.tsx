'use client'

import React, { useState, useCallback } from 'react'
import {
  Button,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Autocomplete,
  AutocompleteItem
} from '@nextui-org/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface TagManagementProps {
  patchId: number
  existingTags: PatchTag[]
  selectedTags: PatchTag[]
  onTagsChange: (tags: PatchTag[]) => void
}

const newTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(107),
  introduction: z.string().max(10007),
  alias: z.array(z.string().max(107))
})

type NewTagForm = z.infer<typeof newTagSchema>

export const CreateTag = ({
  patchId,
  existingTags,
  selectedTags,
  onTagsChange
}: TagManagementProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [newAlias, setNewAlias] = useState('')
  const [aliases, setAliases] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<NewTagForm>({
    resolver: zodResolver(newTagSchema)
  })

  const handleAddAlias = () => {
    if (newAlias && !aliases.includes(newAlias)) {
      setAliases([...aliases, newAlias])
      setNewAlias('')
    }
  }

  const handleRemoveAlias = (alias: string) => {
    setAliases(aliases.filter((a) => a !== alias))
  }

  const handleSelectTag = (tagId: string) => {
    const tag = existingTags.find((t) => t.id.toString() === tagId)
    if (tag && !selectedTags.find((t) => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagId))
  }

  const onSubmit = async (data: NewTagForm) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          alias: aliases,
          patchId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      const newTag = await response.json()
      onTagsChange([...selectedTags, newTag])
      reset()
      setAliases([])
      onClose()
    } catch (error) {
      console.error('Error creating tag:', error)
      // Handle error appropriately
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Chip
            key={tag.id}
            onClose={() => handleRemoveTag(tag.id)}
            variant="flat"
            color="primary"
          >
            {tag.name}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2">
        <Autocomplete
          label="Add existing tag"
          className="flex-1"
          onSelectionChange={(key) => handleSelectTag(key.toString())}
        >
          {existingTags
            .filter((tag) => !selectedTags.find((t) => t.id === tag.id))
            .map((tag) => (
              <AutocompleteItem key={tag.id} value={tag.id}>
                {tag.name}
              </AutocompleteItem>
            ))}
        </Autocomplete>

        <Button color="primary" onPress={onOpen}>
          Create New Tag
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>Create New Tag</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Tag Name"
                  {...register('name')}
                  errorMessage={errors.name?.message}
                />

                <Input
                  label="Introduction"
                  {...register('introduction')}
                  errorMessage={errors.introduction?.message}
                />

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      label="Add Alias"
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      className="flex-1"
                    />
                    <Button color="primary" onPress={handleAddAlias}>
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {aliases.map((alias) => (
                      <Chip
                        key={alias}
                        onClose={() => handleRemoveAlias(alias)}
                        variant="flat"
                      >
                        {alias}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Create Tag
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}
