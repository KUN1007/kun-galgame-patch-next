'use client'

import { useState } from 'react'
import {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea
} from '@nextui-org/react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import {
  SUPPORTED_TYPES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_PLATFORMS
} from '~/constants/resource'
import { api } from '~/lib/trpc-client'
import toast from 'react-hot-toast'
import { patchResourceCreateSchema } from '~/validations/patch'
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
  if (!resource) {
    return
  }

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EditResourceFormData>({
    resolver: zodResolver(patchResourceCreateSchema),
    defaultValues: {
      patchId: resource.patchId,
      link: resource.link,
      type: resource.type,
      language: resource.language,
      platform: resource.platform,
      size: resource.size,
      code: resource.code,
      password: resource.password,
      note: resource.note
    }
  })

  const [editing, setEditing] = useState(false)
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
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">资源链接</h3>
              {watch().link.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    isRequired
                    placeholder="请输入资源链接"
                    value={link}
                    isInvalid={!!errors.link?.[index]}
                    errorMessage={errors.link?.[index]?.message}
                    onChange={(e) => {
                      const newLinks = [...watch().link]
                      newLinks[index] = e.target.value
                      setValue('link', newLinks)
                    }}
                  />
                  {index === watch().link.length - 1 ? (
                    <Button
                      isIconOnly
                      variant="flat"
                      onPress={() => setValue('link', [...watch().link, ''])}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      isIconOnly
                      variant="flat"
                      color="danger"
                      onPress={() => {
                        const newLinks = watch().link.filter(
                          (_, i) => i !== index
                        )
                        setValue('link', newLinks)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    label="类型"
                    placeholder="请选择资源的类型"
                    selectionMode="multiple"
                    selectedKeys={field.value}
                    onSelectionChange={(keys) =>
                      field.onChange([...keys] as string[])
                    }
                    isInvalid={!!errors.type}
                    errorMessage={errors.type?.message}
                  >
                    {SUPPORTED_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select
                    label="语言"
                    placeholder="请选择语言"
                    selectionMode="multiple"
                    selectedKeys={field.value}
                    onSelectionChange={(keys) =>
                      field.onChange([...keys] as string[])
                    }
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              <Controller
                name="platform"
                control={control}
                render={({ field }) => (
                  <Select
                    label="平台"
                    placeholder="请选择资源的平台"
                    selectionMode="multiple"
                    selectedKeys={field.value}
                    onSelectionChange={(keys) =>
                      field.onChange([...keys] as string[])
                    }
                  >
                    {SUPPORTED_PLATFORMS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              <Controller
                name="size"
                control={control}
                render={({ field }) => (
                  <Input {...field} label="Size" placeholder="e.g., 1.2GB" />
                )}
              />
            </div>

            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="提取码 (可选)"
                  placeholder="如果资源的获取需要密码, 请填写密码"
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="解压码 (可选)"
                  placeholder="如果资源的解压需要解压码, 请填写解压码"
                />
              )}
            />

            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  label="备注 (可选)"
                  placeholder="您可以在此处随意添加备注, 例如资源的注意事项等"
                />
              )}
            />
          </div>
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
