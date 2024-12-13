'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader, Input, Link } from '@nextui-org/react'
import { useCreatePatchStore } from '~/store/editStore'
import { VNDBInput } from './VNDBInput'
import { AliasInput } from './AliasInput'
import { BannerImage } from './BannerImage'
import { PublishButton } from './PublishButton'
import { PatchIntroduction } from './PatchIntroduction'
import { KunTextDivider } from '~/components/kun/TextDivider'
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
            <h1 className="text-2xl">创建新游戏</h1>
            <p className="text-default-500">
              您需要创建一个新游戏, 稍后在游戏页面添加补丁资源
            </p>
            <Link
              className="flex"
              underline="hover"
              href="/about/notice/galgame-tutorial"
            >
              如何在鲲 Galgame 补丁发布 Galgame
            </Link>
          </div>
        </CardHeader>
        <CardBody className="mt-4 space-y-12">
          <Input
            isRequired
            variant="underlined"
            labelPlacement="outside"
            label="游戏名称"
            placeholder="输入游戏名称, 这会作为游戏的标题"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
          />

          <PatchIntroduction errors={errors.banner} />

          <BannerImage errors={errors.banner} />

          <KunTextDivider text="非必须字段" />

          <VNDBInput errors={errors.vndbId} />

          <AliasInput errors={errors.alias} />

          <PublishButton setErrors={setErrors} />
        </CardBody>
      </Card>
    </form>
  )
}
