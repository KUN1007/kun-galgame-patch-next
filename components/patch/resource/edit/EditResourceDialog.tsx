'use client'

import { z } from 'zod'
import { Button } from '@nextui-org/button'
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@nextui-org/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { kunFetchPut } from '~/utils/kunFetch'
import { patchResourceCreateSchema } from '~/validations/patch'
import { ResourceLinksInput } from '../publish/ResourceLinksInput'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { ResourceDetailsForm } from '../publish/ResourceDetailsForm'
import { FileUploadContainer } from '../upload/FileUploadContainer'
import { KunEditor } from '~/components/kun/milkdown/Editor'
import type { PatchResourceHtml } from '~/types/api/patch'

type EditResourceFormData = z.infer<typeof patchResourceCreateSchema>

interface EditResourceDialogProps {
  resource: PatchResourceHtml
  onClose: () => void
  onSuccess: (resource: PatchResourceHtml) => void
  type?: 'patch' | 'admin'
}

export const EditResourceDialog = ({
  resource,
  onClose,
  onSuccess,
  type = 'patch'
}: EditResourceDialogProps) => {
  const [editing, setEditing] = useState(false)
  const [uploadingResource, setUploadingResource] = useState(false)

  const {
    control,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EditResourceFormData>({
    resolver: zodResolver(patchResourceCreateSchema),
    defaultValues: resource
  })

  const handleUpdateResource = async () => {
    setEditing(true)
    const res = await kunFetchPut<KunResponse<PatchResourceHtml>>(
      `/${type}/resource`,
      { resourceId: resource.id, ...watch() }
    )
    kunErrorHandler(res, (value) => {
      reset()
      onSuccess(value)
      toast.success('资源更新成功')
    })
    setEditing(false)
  }

  const handleUploadSuccess = (
    storage: string,
    hash: string,
    content: string,
    size: string
  ) => {
    setValue('storage', storage)
    setValue('hash', hash)
    setValue('content', content)
    setValue('size', size)
  }

  const handleRemoveFile = () => {
    setValue('hash', '')
    setValue('content', '')
    setValue('size', '')
  }

  return (
    <ModalContent>
      <ModalHeader className="flex-col space-y-2">
        <h3 className="text-lg">更改资源链接</h3>
        <p className="text-sm font-medium text-default-500">
          若您想要更改您的对象存储链接, 您现在可以直接上传新文件,
          系统会自动更新云端文件, 无需删除后重新发布
        </p>
      </ModalHeader>

      <ModalBody>
        <form className="space-y-6">
          {watch().storage !== 'user' && (
            <FileUploadContainer
              onSuccess={handleUploadSuccess}
              handleRemoveFile={handleRemoveFile}
              setUploadingResource={setUploadingResource}
            />
          )}

          {(watch().storage === 'user' || watch().content) && (
            <ResourceLinksInput
              errors={errors}
              storage={watch().storage}
              content={watch().content}
              setContent={(content) => setValue('content', content)}
            />
          )}
          <ResourceDetailsForm control={control} errors={errors} />

          <div className="space-y-2">
            <h3 className="text-lg font-medium">资源备注</h3>
            <div className="text-sm font-medium text-default-500">
              我们建议您详细的说明如何使用您发布的补丁, 例如
              <ul>
                <li>
                  - 注意事项 / 使用说明 (闪退说明, 不兼容 xxx, 需要安装 xxx)
                </li>
                <li> - 原创 / 授权说明 (补丁的作者, 以及是否为原创或是转载)</li>
                <li>
                  - 更新日志 (网站只会通知用户该补丁被作者更新,
                  更新的对于补丁的具体影响可以列举说明)
                </li>
              </ul>
            </div>

            <KunEditor
              valueMarkdown={watch().note}
              saveMarkdown={(markdown) => setValue('note', markdown)}
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button color="danger" variant="light" onPress={onClose}>
          取消
        </Button>
        <Button
          color="primary"
          disabled={editing || uploadingResource}
          isLoading={editing || uploadingResource}
          onPress={handleUpdateResource}
        >
          {editing
            ? '更新中...'
            : uploadingResource
              ? '正在上传补丁资源中...'
              : '保存'}
        </Button>
      </ModalFooter>
    </ModalContent>
  )
}
