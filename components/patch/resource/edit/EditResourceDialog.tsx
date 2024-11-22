'use client'

import { z } from 'zod'
import {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
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
    onClose()
    setEditing(false)
    toast.success('资源更新成功')
  }

  return (
    <ModalContent>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>编辑资源</ModalHeader>
        <ModalBody>
          <ResourceLinksInput
            errors={errors}
            links={watch().link}
            setValue={(links) => setValue('link', links)}
          />
          <ResourceDetailsForm control={control} errors={errors} />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          <Button
            color="primary"
            type="submit"
            disabled={editing}
            isLoading={editing}
          >
            保存
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}
