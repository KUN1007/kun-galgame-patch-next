'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader, Input } from '@nextui-org/react'
import { useCreatePatchStore } from '~/store/editStore'
import { Editor } from '~/components/kun/milkdown/PatchEditor'
import { VNDBInput } from './VNDBInput'
import { AliasInput } from './AliasInput'
import { BannerImage } from './BannerImage'
import { PublishButton } from './PublishButton'
import type { CreatePatchRequestData } from '~/store/editStore'

export const CreatePatch = () => {
  const { data, setData } = useCreatePatchStore()
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreatePatchRequestData, string>>
  >({})

  return (
    <form className="flex-1 w-full mx-auto">
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-2xl">创建新游戏</p>
            <p className="text-small text-default-500">
              您需要创建一个新游戏, 稍后在游戏页面添加补丁资源
            </p>
          </div>
        </CardHeader>
        <CardBody className="gap-4 mt-2">
          <VNDBInput errors={errors.vndbId} />

          <BannerImage errors={errors.banner} />

          <Input
            isRequired
            className="mb-4"
            variant="underlined"
            labelPlacement="outside"
            label="游戏名称"
            placeholder="输入游戏名称, 这会作为游戏的标题"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
          />

          <p className="text-sm">游戏介绍 (必须, 十个字符以上)</p>
          {errors.introduction && (
            <p className="text-xs text-danger-500">{errors.introduction}</p>
          )}
          <Editor storeName="patchCreate" />

          <AliasInput errors={errors.alias} />

          <PublishButton setErrors={setErrors} />
        </CardBody>
      </Card>
    </form>
  )
}
