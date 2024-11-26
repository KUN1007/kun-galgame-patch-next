'use client'

import { z } from 'zod'
import { Button } from '@nextui-org/button'
import {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@nextui-org/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { api } from '~/lib/trpc-client'
import { patchResourceCreateSchema } from '~/validations/patch'
import { ResourceLinksInput } from '../publish/ResourceLinksInput'
import { ResourceDetailsForm } from '../publish/ResourceDetailsForm'
import type { PatchResource } from '~/types/api/patch'

type EditResourceFormData = z.infer<typeof patchResourceCreateSchema>

interface EditResourceDialogProps {
  resource: PatchResource | null
  onClose: () => void
  onSuccess: (resource: PatchResource) => void
}

export const EditResourceDialog = ({
  resource,
  onClose,
  onSuccess
}: EditResourceDialogProps) => {
  if (!resource) return null

  const [editing, setEditing] = useState(false)
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EditResourceFormData>({
    resolver: zodResolver(patchResourceCreateSchema),
    defaultValues: resource
  })

  const onSubmit = async (data: EditResourceFormData) => {
    setEditing(true)
    const res = await api.patch.updatePatchResource.mutate({
      resourceId: resource.id,
      ...data
    })
    onSuccess(res)
    setEditing(false)
    toast.success('资源更新成功')
  }

  return (
    <ModalContent>
      <ModalHeader className="flex-col space-y-2">
        <h3 className="text-lg">资源链接</h3>
        <p className="text-sm font-medium text-default-500">
          对象存储和 OneDrive 资源链接不可更换, 若要更换请您删除资源并重新发布
        </p>
      </ModalHeader>

      <ModalBody>
        <form className="space-y-6">
          <ResourceLinksInput
            errors={errors}
            storage={watch().storage}
            content={watch().content}
            setContent={(content) => setValue('content', content)}
          />
          <ResourceDetailsForm control={control} errors={errors} />
        </form>
      </ModalBody>

      <ModalFooter>
        <Button color="danger" variant="light" onPress={onClose}>
          取消
        </Button>
        <Button
          color="primary"
          disabled={editing}
          isLoading={editing}
          onClick={handleSubmit(onSubmit)}
        >
          保存
        </Button>
      </ModalFooter>
    </ModalContent>
  )
}
