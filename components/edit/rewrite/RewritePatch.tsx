'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Chip
} from '@nextui-org/react'
import { Plus } from 'lucide-react'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { Editor } from '~/components/kun/milkdown/PatchEditor'
import toast from 'react-hot-toast'
import { api } from '~/lib/trpc-client'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import { patchUpdateSchema } from '~/validations/edit'
import { useRouter } from 'next/navigation'
import type { RewritePatchData } from '~/store/rewriteStore'

export const RewritePatch = () => {
  const router = useRouter()
  const { data, setData } = useRewritePatchStore()
  const [newAlias, setNewAlias] = useState<string>('')
  const [errors, setErrors] = useState<
    Partial<Record<keyof RewritePatchData, string>>
  >({})

  const addAlias = () => {
    const alias = newAlias.trim().toLowerCase()
    if (data.alias.includes(alias)) {
      toast.error('请不要使用重复的别名')
      return
    }
    if (newAlias.trim()) {
      setData({ ...data, alias: [...data.alias, alias] })
      setNewAlias('')
    }
  }

  const removeAlias = (index: number) => {
    setData({
      ...data,
      alias: data.alias.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    const result = patchUpdateSchema.safeParse(data)
    if (!result.success) {
      const newErrors: Partial<Record<keyof RewritePatchData, string>> = {}
      result.error.errors.forEach((err) => {
        if (err.path.length) {
          newErrors[err.path[0] as keyof RewritePatchData] = err.message
          toast.error(err.message)
        }
      })
      setErrors(newErrors)
      return
    } else {
      setErrors({})
    }

    const res = await api.edit.updatePatch.mutate(data)
    useErrorHandler(res, async () => {
      router.push(`/patch/${data.id}/introduction`)
    })
  }

  return (
    <form className="flex-1 w-full p-4 mx-auto">
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-2xl">编辑游戏信息</p>
            <p className="text-small text-default-500">
              您需要创建一个新游戏, 稍后在游戏页面添加补丁资源
            </p>
          </div>
        </CardHeader>
        <CardBody className="gap-4 mt-2">
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
          <Editor storeName="patchRewrite" />

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                labelPlacement="outside"
                label="别名"
                placeholder="输入后点击加号添加, 建议填写游戏的日语原名以便搜索"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                className="flex-1"
                isInvalid={!!errors.alias}
                errorMessage={errors.alias}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addAlias()
                }}
              />
              <Button
                color="primary"
                onClick={addAlias}
                className="self-end"
                isIconOnly
              >
                <Plus size={20} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.alias.map((alias, index) => (
                <Chip
                  key={index}
                  onClose={() => removeAlias(index)}
                  variant="flat"
                  className="h-8"
                >
                  {alias}
                </Chip>
              ))}
            </div>
          </div>

          <Button
            color="primary"
            className="w-full mt-4"
            onClick={handleSubmit}
          >
            提交
          </Button>
        </CardBody>
      </Card>
    </form>
  )
}
