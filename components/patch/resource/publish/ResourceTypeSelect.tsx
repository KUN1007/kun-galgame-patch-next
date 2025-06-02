'use client'

import { z } from 'zod'
import { Controller } from 'react-hook-form'
import { Select, SelectItem } from '@heroui/select'
import { patchResourceCreateSchema } from '~/validations/patch'
import { useUserStore } from '~/store/userStore'
import { storageTypes } from '~/constants/resource'
import {
  USER_DAILY_UPLOAD_LIMIT,
  CREATOR_DAILY_UPLOAD_LIMIT
} from '~/config/upload'
import type { ControlType, ErrorType } from '../share'

export type ResourceFormData = z.infer<typeof patchResourceCreateSchema>

interface Props {
  control: ControlType
  errors: ErrorType
}

export const ResourceTypeSelect = ({ control, errors }: Props) => {
  const user = useUserStore((state) => state.user)
  const isReachLimit = () => {
    if (user.role === 1 && user.dailyUploadLimit >= USER_DAILY_UPLOAD_LIMIT) {
      return true
    }
    if (
      user.role === 2 &&
      user.dailyUploadLimit >= CREATOR_DAILY_UPLOAD_LIMIT
    ) {
      return true
    }
    return false
  }

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
              field.onChange(Array.from(key).join(''))
            }}
            disabledKeys={isReachLimit() ? ['s3'] : []}
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
