'use client'

import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Chip,
  Link
} from '@nextui-org/react'
import localforage from 'localforage'
import { Upload, Plus } from 'lucide-react'
import { useEditStore } from '~/store/editStore'
import { cn } from '~/utils/cn'
import { Editor } from '~/components/kun/milkdown/PatchEditor'
import toast from 'react-hot-toast'
import { api } from '~/lib/trpc-client'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import { patchSchema } from '~/validations/edit'
import { resizeImage } from '~/utils/resizeImage'
import { redirect } from 'next/navigation'
import type { PatchFormRequestData } from '~/store/editStore'

export const PatchRewriteForm = () => {
  const { data, setData, resetData } = useEditStore()
  const [banner, setBanner] = useState<Blob | null>(null)
  const [newAlias, setNewAlias] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [errors, setErrors] = useState<
    Partial<Record<keyof PatchFormRequestData, string>>
  >({})

  useEffect(() => {
    const fetchData = async () => {
      const localeBannerBlob: Blob | null =
        await localforage.getItem('kun-patch-banner')
      setBanner(localeBannerBlob)
      if (localeBannerBlob) {
        setPreviewUrl(URL.createObjectURL(localeBannerBlob))
      }
    }
    fetchData()
  }, [])

  const setBannerFile = async (file: File | undefined) => {
    if (!file) {
      toast.error('未检测到图片文件输入')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('您输入的文件不是图片格式')
      return
    }

    const miniImage = await resizeImage(file, 1920, 1080)
    await localforage.setItem('kun-patch-banner', miniImage)
    setBanner(miniImage)
    setPreviewUrl(URL.createObjectURL(miniImage))
  }

  const removeBanner = async () => {
    await localforage.removeItem('kun-patch-banner')
    setBanner(null)
    setPreviewUrl('')
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    await setBannerFile(file)
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = patchSchema.safeParse({
      ...data,
      banner
    })
    if (!result.success) {
      const newErrors: Partial<Record<keyof PatchFormRequestData, string>> = {}
      result.error.errors.forEach((err) => {
        if (err.path.length) {
          newErrors[err.path[0] as keyof PatchFormRequestData] = err.message
          toast.error(err.message)
        }
      })
      setErrors(newErrors)
      return
    } else {
      setErrors({})
    }

    const formDataToSend = new FormData()
    formDataToSend.append('banner', banner!)
    formDataToSend.append('name', data.name)
    formDataToSend.append('vndbId', data.vndbId)
    formDataToSend.append('introduction', data.introduction)
    formDataToSend.append('alias', JSON.stringify(data.alias))

    // @ts-expect-error
    const res = await api.edit.edit.mutate(formDataToSend)
    useErrorHandler(res, async (value) => {
      resetData()
      setPreviewUrl('')
      await localforage.removeItem('kun-patch-banner')
      redirect(`/patch/${value}`)
    })
  }

  const handleCheckDuplicate = async () => {
    const regex = new RegExp(/^v\d{1,6}$/)
    if (!regex.test(data.vndbId)) {
      toast.error('您输入的 VNDB ID 格式无效')
      return
    }

    const res = await api.edit.duplicate.mutate({ vndbId: data.vndbId })
    if (res) {
      toast.error(res)
      return
    } else {
      toast.success('检测完成, 该游戏并未重复!')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 w-full p-4 mx-auto">
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
          <p className="text-sm">预览图片 (必须, 宽度大于高度为好)</p>
          {errors.banner && (
            <p className="text-xs text-red-500">{errors.banner}</p>
          )}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-4 text-center transition-colors  mb-4',
              isDragging ? 'border-primary bg-primary/10' : 'border-gray-300',
              previewUrl ? 'h-full' : 'h-[200px]'
            )}
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            {previewUrl ? (
              <div className="relative h-full">
                <img
                  src={previewUrl}
                  alt="Banner preview"
                  className="object-contain w-full h-full max-h-[512px]"
                />
                <Button
                  color="danger"
                  variant="bordered"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeBanner}
                >
                  移除
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                <p className="mb-2">拖放图片到此处或</p>
                <label>
                  <Button color="primary" variant="flat" as="span">
                    选择文件
                  </Button>
                  <Input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (event) => {
                      await setBannerFile(event.target.files?.[0])
                    }}
                  />
                </label>
              </div>
            )}
          </div>

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
            <p className="text-xs text-red-500">{errors.introduction}</p>
          )}
          <Editor />

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

          <Button color="primary" type="submit" className="w-full mt-4">
            提交
          </Button>
        </CardBody>
      </Card>
    </form>
  )
}
