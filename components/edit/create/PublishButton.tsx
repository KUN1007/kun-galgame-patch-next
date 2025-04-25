'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/react'
import localforage from 'localforage'
import { useCreatePatchStore } from '~/store/editStore'
import { useUserStore } from '~/store/userStore'
import toast from 'react-hot-toast'
import { kunFetchFormData } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { patchCreateSchema } from '~/validations/edit'
import { useRouter } from 'next-nprogress-bar'
import { VNDBRegex } from '~/utils/validate'
import type { Dispatch, SetStateAction } from 'react'
import type { CreatePatchRequestData } from '~/store/editStore'

interface Props {
  setErrors: Dispatch<
    SetStateAction<Partial<Record<keyof CreatePatchRequestData, string>>>
  >
}

export const PublishButton = ({ setErrors }: Props) => {
  const router = useRouter()
  const { data, resetData } = useCreatePatchStore()
  const user = useUserStore((state) => state.user)

  const [creating, setCreating] = useState(false)
  const handleSubmit = async () => {
    const localeBannerBlob: Blob | null =
      await localforage.getItem('kun-patch-banner')
    if (!localeBannerBlob) {
      toast.error('未检测到预览图片')
      return
    }
    if (user.role < 2 && !VNDBRegex.test(data.vndbId)) {
      toast.error('为防止恶意发布, 仅限创作者可以不填写 VNDB ID 发布游戏')
      return
    }

    const result = patchCreateSchema.safeParse({
      ...data,
      banner: localeBannerBlob,
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
    formDataToSend.append('banner', localeBannerBlob!)
    formDataToSend.append('name', data.name)
    formDataToSend.append('vndbId', data.vndbId)
    formDataToSend.append('introduction', data.introduction)
    formDataToSend.append('contentLimit', data.contentLimit)
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
      await localforage.removeItem('kun-patch-banner')
      router.push(`/patch/${value}/introduction`)
    })
    toast.success('发布完成, 正在为您跳转到资源介绍页面')
    setCreating(false)
  }

  return (
    <Button
      color="primary"
      onPress={handleSubmit}
      className="w-full mt-4"
      isDisabled={creating}
      isLoading={creating}
    >
      提交
    </Button>
  )
}
