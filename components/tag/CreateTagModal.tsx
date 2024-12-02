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
  ModalFooter
} from '@nextui-org/modal'
import { Button } from '@nextui-org/button'
import { Input, Textarea } from '@nextui-org/input'
import { Chip } from '@nextui-org/chip'
import { Plus } from 'lucide-react'
import { createTagSchema } from '~/validations/tag'
import { kunFetchPost } from '~/utils/kunFetch'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import toast from 'react-hot-toast'
import type { Tag } from '~/types/api/tag'

type FormData = z.infer<typeof createTagSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (tag: Tag) => void
}

export const CreateTagModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
    setValue,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: '',
      introduction: '',
      alias: []
    }
  })

  const addTag = () => {
    const lowerTag = input.trim().toLowerCase()
    if (!lowerTag) {
      return
    }

    const prevAlias = getValues().alias
    if (!prevAlias?.includes(lowerTag)) {
      setValue('alias', [...prevAlias, lowerTag])
      setInput('')
    } else {
      toast.error('标签已存在, 请更换')
    }
  }

  const handleRemoveAlias = (index: number) => {
    const prevAlias = getValues().alias
    setValue(
      'alias',
      prevAlias?.filter((_, i) => i !== index)
    )
  }

  const onSubmit = async (data: FormData) => {
    if (!data.alias) {
      return
    }
    addTag()

    setIsSubmitting(true)
    const res = await kunFetchPost<KunResponse<Tag>>('/user/tag', data)
    useErrorHandler(res, (value) => {
      reset()
      onSuccess(value)
    })
    setIsSubmitting(false)
  }

  const handleClose = () => {
    reset()
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
                <div className="flex space-x-2">
                  <Input
                    labelPlacement="outside"
                    label="别名"
                    placeholder="可以按回车添加别名"
                    value={input}
                    onChange={(e) => {
                      e.preventDefault()
                      setInput(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button
                    color="primary"
                    onClick={addTag}
                    className="self-end"
                    isIconOnly
                  >
                    <Plus size={20} />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {watch().alias?.map((alias, index) => (
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
