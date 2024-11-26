'use client'

import { z } from 'zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardBody } from '@nextui-org/card'
import toast from 'react-hot-toast'
import { api } from '~/lib/trpc-client'
import { patchResourceCreateSchema } from '~/validations/patch'
import { ResourceLinksInput } from './ResourceLinksInput'
import { ResourceDetailsForm } from './ResourceDetailsForm'
import { SubmitButton } from './SubmitButton'
import { FileUpload } from '../upload/FileUpload'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import type { PatchResource } from '~/types/api/patch'

export type ResourceFormData = z.infer<typeof patchResourceCreateSchema>

interface CreateResourceProps {
  patchId: number
  onSuccess?: (res: PatchResource) => void
}

export const PublishResource = ({
  patchId,
  onSuccess
}: CreateResourceProps) => {
  const [creating, setCreating] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch
  } = useForm<ResourceFormData>({
    resolver: zodResolver(patchResourceCreateSchema),
    defaultValues: {
      patchId,
      storage: 'user',
      hash: '',
      content: '',
      code: '',
      type: [],
      language: [],
      platform: [],
      size: '',
      password: '',
      note: ''
    }
  })

  const onSubmit = async (data: ResourceFormData) => {
    setCreating(true)
    const res = await api.patch.createPatchResource.mutate(data)
    setCreating(false)
    useErrorHandler(res, (value) => {
      reset()
      onSuccess?.(value)
      toast.success('资源发布成功')
    })
  }

  const handleUploadSuccess = (
    storage: string,
    hash: string,
    content: string
  ) => {
    setValue('storage', storage)
    setValue('hash', hash)
    setValue('content', content)
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FileUpload onSuccess={handleUploadSuccess} />
          <ResourceLinksInput
            errors={errors}
            storage={watch().storage}
            content={watch().content}
            setContent={(content) => setValue('content', content)}
          />
          <ResourceDetailsForm control={control} errors={errors} />
          <div className="flex justify-end">
            <SubmitButton creating={creating} />
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
