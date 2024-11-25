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
      link: [
        {
          id: 0,
          type: 'user',
          content: '',
          hash: ''
        }
      ],
      type: [],
      language: [],
      platform: [],
      size: '',
      code: '',
      password: '',
      note: ''
    }
  })

  const onSubmit = async (data: ResourceFormData) => {
    setCreating(true)
    const res = await api.patch.createPatchResource.mutate(data)
    reset()
    onSuccess?.(res)
    setCreating(false)
    toast.success('资源发布成功')
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FileUpload
            onSuccess={(link) => setValue('link', [...watch().link, link])}
          />
          <ResourceLinksInput
            errors={errors}
            links={watch().link}
            setValue={(links) => setValue('link', links)}
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
