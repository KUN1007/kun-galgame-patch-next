'use client'

import React, { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Link
} from '@nextui-org/react'
import localforage from 'localforage'
import { Plus, Upload } from 'lucide-react'
import { useCreatePatchStore } from '~/store/editStore'
import { cn } from '~/utils/cn'
import { Editor } from '~/components/kun/milkdown/PatchEditor'
import toast from 'react-hot-toast'
import { kunFetchFormData, kunFetchGet } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { patchCreateSchema } from '~/validations/edit'
import { resizeImage } from '~/utils/resizeImage'
import { useRouter } from 'next-nprogress-bar'
import type { CreatePatchRequestData } from '~/store/editStore'
import type { VNDBResponse } from '../VNDB'

export const CreatePatch = () => {
  const router = useRouter()
  const { data, setData, resetData } = useCreatePatchStore()
  const [banner, setBanner] = useState<Blob | null>(null)
  const [newAlias, setNewAlias] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreatePatchRequestData, string>>
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

  const [creating, setCreating] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = patchCreateSchema.safeParse({
      ...data,
      banner,
      alias: JSON.stringify(data.alias)
    })
    if (!result.success) {
      const newErrors: Partial<Record<keyof CreatePatchRequestData, string>> =
        {}
      result.error.errors.forEach((err) => {
        if (err.path.length) {
          newErrors[err.path[0] as keyof CreatePatchRequestData] = err.message
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
    formDataToSend.append('released', data.released)

    setCreating(true)
    toast(
      '正在发布中...由于要上传图片, 可能需要 十秒 左右的时间, 这取决于您的网络环境'
    )

    const res = await kunFetchFormData<KunResponse<number>>(
      '/edit',
      formDataToSend
    )
    kunErrorHandler(res, async (value) => {
      resetData()
      setPreviewUrl('')
      await localforage.removeItem('kun-patch-banner')
      router.push(`/patch/${value}/introduction`)
    })
    toast.success('发布完成, 正在为您跳转到资源介绍页面')
    setCreating(false)
  }

  const handleCheckDuplicate = async () => {
    const regex = new RegExp(/^v\d{1,6}$/)
    if (!regex.test(data.vndbId)) {
      toast.error('您输入的 VNDB ID 格式无效')
      return
    }

    const res = await kunFetchGet<KunResponse<{}>>('/edit/duplicate', {
      vndbId: data.vndbId
    })
    if (typeof res === 'string') {
      toast.error('游戏重复, 该游戏已经有人发布过了')
      return
    } else {
      toast.success('检测完成, 该游戏并未重复!')
    }

    toast.promise(
      (async () => {
        const vndbResponse = await fetch(`https://api.vndb.org/kana/vn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filters: ['id', '=', data.vndbId],
            fields: 'title, titles.title, aliases, released'
          })
        })

        if (!vndbResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const vndbData: VNDBResponse = await vndbResponse.json()
        const allTitles = vndbData.results.flatMap((vn) => {
          const titlesArray = [
            vn.title,
            ...vn.titles.map((t) => t.title),
            ...vn.aliases
          ]
          return titlesArray
        })

        setData({
          ...data,
          alias: allTitles,
          released: vndbData.results[0].released
        })
      })(),
      {
        loading: '正在从 VNDB 获取数据',
        success: '获取数据成功! 已为您自动添加游戏别名!',
        error: '从 VNDB 获取数据错误'
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 w-full p-4 mx-auto">
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
          <div className="flex flex-col w-full gap-2 mb-4">
            <Input
              isRequired
              variant="underlined"
              labelPlacement="outside"
              label="VNDB ID"
              placeholder="请输入 VNDB ID, 例如 v19658"
              value={data.vndbId}
              onChange={(e) => setData({ ...data, vndbId: e.target.value })}
              isInvalid={!!errors.vndbId}
              errorMessage={errors.vndbId}
            />
            <p className="text-sm ">
              提示: VNDB ID 需要 VNDB 官网 (vndb.org)
              获取，当进入对应游戏的页面，游戏页面的 URL (形如
              https://vndb.org/v19658) 中的 v19658 就是 VNDB ID
            </p>
            <div className="flex items-center text-sm">
              {data.vndbId && (
                <Button
                  className="mr-4"
                  color="primary"
                  size="sm"
                  onClick={handleCheckDuplicate}
                >
                  检查重复
                </Button>
              )}

              <p>VNDB 官网为</p>
              <Link
                href="http://vndb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2"
              >
                vndb.org
              </Link>
            </div>
          </div>

          <p className="text-sm">预览图片 (必须, 宽度大于高度为好)</p>
          {errors.banner && (
            <p className="text-xs text-danger-500">{errors.banner}</p>
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
                  className="size-full max-h-[512px] object-contain"
                />
                <Button
                  color="danger"
                  variant="bordered"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={removeBanner}
                >
                  移除
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Upload className="mb-4 size-12 text-default-400" />
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
            <p className="text-xs text-danger-500">{errors.introduction}</p>
          )}
          <Editor storeName="patchCreate" />

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
            type="submit"
            className="w-full mt-4"
            isDisabled={creating}
            isLoading={creating}
          >
            提交
          </Button>
        </CardBody>
      </Card>
    </form>
  )
}
