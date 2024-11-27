'use client'

import { z } from 'zod'
import { Controller } from 'react-hook-form'
import { Select, SelectItem } from '@nextui-org/select'
import { patchResourceCreateSchema } from '~/validations/patch'
import { useUserStore } from '~/store/providers/user'
import { ErrorType, ControlType } from '../share'

export type ResourceFormData = z.infer<typeof patchResourceCreateSchema>

interface Props {
  control: ControlType
  errors: ErrorType
}

const storageTypes = [
  {
    value: 's3',
    label: '对象存储 (<100MB, 创作者可用)',
    description: '此选项适合 <100MB 的补丁, 稳定, 永远不会失效过期'
  },
  {
    value: 'onedrive',
    label: 'OneDrive (>100MB, <1GB, 创作者可用)',
    description: '此选项适合 >100MB 且 <1GB 的补丁, 较稳定, 我们还在开发中...'
  },
  {
    value: 'user',
    label: '自定义链接 (>100MB)',
    description: '此选项适合 >100MB 的补丁, 这需要您自行提供下载链接'
  }
]

export const ResourceTypeSelect = ({ control, errors }: Props) => {
  const user = useUserStore((state) => state.user)

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">选择存储类型</h3>
      <p className="text-sm text-default-500">
        确定您的补丁体积大小以便选择合适的存储方式
      </p>

      <Controller
        name="storage"
        control={control}
        render={({ field }) => (
          <Select
            label="请选择您的资源存储类型"
            selectedKeys={[field.value]}
            onSelectionChange={(key) => {
              if (key.currentKey === key.anchorKey) {
                return
              }
              field.onChange(Array.from(key).join(''))
            }}
            disabledKeys={user.role > 1 ? ['onedrive'] : ['onedrive', 's3']}
            isInvalid={!!errors.storage}
            errorMessage={errors.storage?.message}
          >
            {storageTypes.map((type) => (
              <SelectItem key={type.value} textValue={type.label}>
                <div className="flex flex-col">
                  <span className="text">{type.label}</span>
                  <span className="text-small text-default-500">
                    {type.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </Select>
        )}
      />
    </div>
  )
}
