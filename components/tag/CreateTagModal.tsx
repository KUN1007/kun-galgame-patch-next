'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Chip
} from '@nextui-org/react'
import { createTagSchema } from '~/validations/tag'
import { api } from '~/lib/trpc-client'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import type { Tag } from '~/types/api/tag'

type FormData = z.infer<typeof createTagSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (tag: Tag) => void
}

export const CreateTagModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [aliases, setAliases] = useState<string[]>([])
  const [aliasInput, setAliasInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(createTagSchema)
  })

  const handleAddAlias = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && aliasInput.trim()) {
      e.preventDefault()
      if (!aliases.includes(aliasInput.trim())) {
        setAliases([...aliases, aliasInput.trim()])
      }
      setAliasInput('')
    }
  }

  const handleRemoveAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    const res = await api.tag.createTag.mutate(data)
    useErrorHandler(res, (value) => {
      reset()
      setAliases([])
      setAliasInput('')
      onSuccess(value)
    })

    setIsSubmitting(false)
  }

  const handleClose = () => {
    reset()
    setAliases([])
    setAliasInput('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>创建新标签</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <Input
                {...register('name')}
                label="标签名称"
                placeholder="输入标签名称"
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
              />

              <Textarea
                {...register('introduction')}
                label="标签简介"
                placeholder="输入标签简介"
                isInvalid={!!errors.introduction}
                errorMessage={errors.introduction?.message}
              />

              <div className="space-y-2">
                <Input
                  label="别名"
                  placeholder="按回车添加别名"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  onKeyDown={handleAddAlias}
                />
                <div className="flex flex-wrap gap-2">
                  {aliases.map((alias, index) => (
                    <Chip
                      key={index}
                      onClose={() => handleRemoveAlias(index)}
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
            <Button variant="flat" onPress={handleClose}>
              取消
            </Button>
            <Button
              color="primary"
              type="submit"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
            >
              创建
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
