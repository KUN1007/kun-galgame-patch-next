'use client'

import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardBody } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import { Input, Textarea } from '@nextui-org/input'
import { Select, SelectItem } from '@nextui-org/select'
import { Upload, Plus, X } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import toast from 'react-hot-toast'
import { patchResourceCreateSchema } from '~/validations/patch'
import {
  SUPPORTED_TYPES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_PLATFORMS
} from './_constants'

interface CreateResourceProps {
  patchId: number
  onSuccess?: () => void
}

type ResourceFormData = z.infer<typeof patchResourceCreateSchema>

export const PublishResource = ({
  patchId,
  onSuccess
}: CreateResourceProps) => {
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
      link: [''],
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
    await api.patch.createPatchResource.mutate(data)

    toast.success('资源发布成功')
    reset()
    onSuccess?.()
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    e.preventDefault()
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

          <div className="space-y-2">
            <h3 className="text-lg font-medium">资源详情</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    isRequired
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
                    isRequired
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
                    isRequired
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
                  <Input
                    {...field}
                    isRequired
                    label="Size"
                    placeholder="e.g., 1.2GB"
                  />
                )}
              />
            </div>

            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="提取码"
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
                  label="解压码"
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
                  label="备注"
                  placeholder="您可以在此处随意添加备注, 例如资源的注意事项等"
                />
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              color="primary"
              startContent={<Upload className="w-4 h-4" />}
            >
              发布资源
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
