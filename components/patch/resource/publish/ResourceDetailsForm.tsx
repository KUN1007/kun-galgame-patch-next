import { Controller } from 'react-hook-form'
import { Input, Textarea } from '@nextui-org/input'
import { Select, SelectItem } from '@nextui-org/select'
import {
  SUPPORTED_TYPE,
  SUPPORTED_TYPE_MAP,
  SUPPORTED_LANGUAGE,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM,
  SUPPORTED_PLATFORM_MAP
} from '~/constants/resource'
import { ErrorType, ControlType } from '../share'

interface ResourceDetailsFormProps {
  control: ControlType
  errors: ErrorType
}

export const ResourceDetailsForm = ({
  control,
  errors
}: ResourceDetailsFormProps) => (
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
            onSelectionChange={(key) => {
              if (key.currentKey === key.anchorKey) {
                return
              }
              field.onChange([...key] as string[])
            }}
            isInvalid={!!errors.type}
            errorMessage={errors.type?.message}
          >
            {SUPPORTED_TYPE.map((type) => (
              <SelectItem key={type} value={type}>
                {SUPPORTED_TYPE_MAP[type]}
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
            onSelectionChange={(key) => {
              if (key.currentKey === key.anchorKey) {
                return
              }
              field.onChange([...key] as string[])
            }}
            isInvalid={!!errors.language}
            errorMessage={errors.language?.message}
          >
            {SUPPORTED_LANGUAGE.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {SUPPORTED_LANGUAGE_MAP[lang]}
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
            onSelectionChange={(key) => {
              if (key.currentKey === key.anchorKey) {
                return
              }
              field.onChange([...key] as string[])
            }}
            isInvalid={!!errors.platform}
            errorMessage={errors.platform?.message}
          >
            {SUPPORTED_PLATFORM.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {SUPPORTED_PLATFORM_MAP[platform]}
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
            label="大小"
            placeholder="请输入资源的大小, 例如 1.007MB"
            isInvalid={!!errors.size}
            errorMessage={errors.size?.message}
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
          isInvalid={!!errors.password}
          errorMessage={errors.password?.message}
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
          isInvalid={!!errors.code}
          errorMessage={errors.code?.message}
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
          isInvalid={!!errors.note}
          errorMessage={errors.note?.message}
        />
      )}
    />
  </div>
)
