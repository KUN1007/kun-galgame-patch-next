'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader, Input, Link } from '@heroui/react'
import { useCreatePatchStore } from '~/store/editStore'
import { VNDBInput } from './VNDBInput'
import { AliasInput } from './AliasInput'
import { BannerImage } from './BannerImage'
import { PublishButton } from './PublishButton'
import { PatchIntroduction } from './PatchIntroduction'
import { ContentLimit } from './ContentLimit'
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
          <VNDBInput errors={errors.vndbId} />

          <BannerImage errors={errors.banner} />

          <div className="space-y-2">
            <h2 className="text-xl">三、游戏名称</h2>
            <p className="text-sm text-default-500">
              输入游戏名称, 这会作为游戏的标题, 填写一种语言即可, 多个也可以
              (我们会根据 VNDB ID 自动同步游戏标题和介绍)
            </p>

            <div className="grid sm:grid-cols-2 grid-cols-1 gap-2">
              <Input
                isRequired
                labelPlacement="outside"
                placeholder="日语标题"
                value={data.name['ja-jp']}
                onChange={(e) =>
                  setData({
                    ...data,
                    name: {
                      'en-us': data.name['en-us'],
                      'ja-jp': e.target.value,
                      'zh-cn': data.name['zh-cn']
                    }
                  })
                }
                isInvalid={!!errors.name}
                errorMessage={errors.name}
              />
              <Input
                isRequired
                labelPlacement="outside"
                placeholder="中文标题"
                value={data.name['zh-cn']}
                onChange={(e) =>
                  setData({
                    ...data,
                    name: {
                      'en-us': data.name['en-us'],
                      'ja-jp': data.name['ja-jp'],
                      'zh-cn': e.target.value
                    }
                  })
                }
                isInvalid={!!errors.name}
                errorMessage={errors.name}
              />
              <Input
                isRequired
                labelPlacement="outside"
                placeholder="英语标题"
                value={data.name['en-us']}
                onChange={(e) =>
                  setData({
                    ...data,
                    name: {
                      'en-us': e.target.value,
                      'ja-jp': data.name['ja-jp'],
                      'zh-cn': data.name['zh-cn']
                    }
                  })
                }
                isInvalid={!!errors.name}
                errorMessage={errors.name}
              />
            </div>
          </div>

          <PatchIntroduction errors={errors.banner} />

          <AliasInput errors={errors.alias} />

          <ContentLimit errors={errors.contentLimit} />

          <PublishButton setErrors={setErrors} />
        </CardBody>
      </Card>
    </form>
  )
}
