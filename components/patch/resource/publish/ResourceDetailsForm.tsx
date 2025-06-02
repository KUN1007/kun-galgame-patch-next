import { Controller } from 'react-hook-form'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import {
  resourceTypes,
  SUPPORTED_LANGUAGE,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM,
  SUPPORTED_PLATFORM_MAP
} from '~/constants/resource'
import { ControlType, ErrorType } from '../share'

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
              field.onChange([...key] as string[])
            }}
            isInvalid={!!errors.type}
            errorMessage={errors.type?.message}
          >
            {resourceTypes.map((type) => (
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
              field.onChange([...key] as string[])
            }}
            isInvalid={!!errors.language}
            errorMessage={errors.language?.message}
          >
            {SUPPORTED_LANGUAGE.map((lang) => (
              <SelectItem key={lang}>{SUPPORTED_LANGUAGE_MAP[lang]}</SelectItem>
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
              field.onChange([...key] as string[])
            }}
            isInvalid={!!errors.platform}
            errorMessage={errors.platform?.message}
          >
            {SUPPORTED_PLATFORM.map((platform) => (
              <SelectItem key={platform}>
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
            label="大小 (MB 或 GB)"
            placeholder="请输入资源的大小, 例如 1.007MB"
            isInvalid={!!errors.size}
            errorMessage={errors.size?.message}
          />
        )}
      />
    </div>

    <Controller
      name="name"
      control={control}
      render={({ field }) => (
        <Input
          {...field}
          label="资源名称 (可选)"
          placeholder="请填写资源的名称, 例如 枯れない世界と終わる花 翻译补丁 "
          isInvalid={!!errors.name}
          errorMessage={errors.name?.message}
        />
      )}
    />

    <Controller
      name="modelName"
      control={control}
      render={({ field }) => (
        <Input
          {...field}
          label="AI 模型名称 (可选)"
          placeholder="如果您发布的是 AI 翻译补丁, 我们建议您填写您使用的翻译模型名称, 例如 claude-3-7-sonnet-20250219"
          isInvalid={!!errors.modelName}
          errorMessage={errors.modelName?.message}
        />
      )}
    />

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
  </div>
)
