'use client'

import React, { useState } from 'react'
import { Button } from '@nextui-org/button'
import { Input } from '@nextui-org/input'
import localforage from 'localforage'
import { Upload } from 'lucide-react'
import { ModalBody, ModalFooter } from '@nextui-org/modal'
import { cn } from '~/utils/cn'
import toast from 'react-hot-toast'
import { kunFetchFormData } from '~/utils/kunFetch'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import { resizeImage } from '~/utils/resizeImage'

interface Props {
  patchId: number
  onClose: () => void
}

export const RewritePatchBanner = ({ patchId, onClose }: Props) => {
  const [banner, setBanner] = useState<Blob | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')

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
    setPreviewUrl(URL.createObjectURL(miniImage))
    setBanner(miniImage)
  }

  const removeBanner = async () => {
    await localforage.removeItem('kun-patch-banner')
    setPreviewUrl('')
    setBanner(null)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    await setBannerFile(file)
  }

  const [updating, setUpdating] = useState(false)
  const handleUpdateBanner = async () => {
    if (!banner) {
      toast.error('请选择一张新的预览图片')
      return
    }

    const formData = new FormData()
    formData.append('patchId', patchId.toString())
    formData.append('image', banner)

    setUpdating(true)

    const res = await kunFetchFormData<KunResponse<{}>>(
      '/user/patch/banner',
      formData
    )
    useErrorHandler(res, () => {
      setBanner(null)
      setPreviewUrl('')
    })
    toast.success('更新图片成功')
    setUpdating(false)
    onClose()
  }

  return (
    <>
      <ModalBody>
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

        <p>
          更改图片后, 由于缓存的原因, 更改不会立即生效。您可以尝试使用 Ctrl + F5
          刷新页面, 或者等待一段时间后重新访问本页面
        </p>
      </ModalBody>

      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          取消
        </Button>
        <Button
          color="danger"
          onPress={handleUpdateBanner}
          disabled={updating}
          isLoading={updating}
        >
          更改
        </Button>
      </ModalFooter>
    </>
  )
}
