'use client'

import { useState } from 'react'
import { Alert, Card, CardBody, CardHeader, Link } from '@heroui/react'
import { VNDBInput } from './VNDBInput'
import { BannerImage } from './BannerImage'
import { PublishButton } from './PublishButton'
import { ContentLimit } from './ContentLimit'
import type { CreatePatchRequestData } from '~/store/editStore'

export const CreatePatch = () => {
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreatePatchRequestData, string>>
  >({})

  return (
    <form className="flex-1 w-full mx-auto">
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col gap-2">
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
            <Alert
              color="success"
              title="我们正在构建世界最大最全的 Galgame 数据库"
              description="现在发布游戏仅需要填写 VNDB ID 和一张预览图片, 剩下的游戏数据我们会自动聚合, 如果一切顺利, 数据库约一到两年构建完毕, 届时无需任何人创建新的游戏项目"
            />
          </div>
        </CardHeader>
        <CardBody className="mt-4 space-y-12">
          <VNDBInput errors={errors.vndbId} />

          <BannerImage errors={errors.banner} />

          <ContentLimit errors={errors.contentLimit} />

          <PublishButton setErrors={setErrors} />
        </CardBody>
      </Card>
    </form>
  )
}
