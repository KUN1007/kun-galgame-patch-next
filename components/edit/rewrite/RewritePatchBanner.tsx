'use client'

import toast from 'react-hot-toast'
import { useState } from 'react'
import { Button } from '@nextui-org/button'
import { ModalBody, ModalFooter } from '@nextui-org/modal'
import { kunFetchFormData } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { KunImageCropper } from '~/components/kun/cropper/KunImageCropper'
import { dataURItoBlob } from '~/utils/dataURItoBlob'

interface Props {
  patchId: number
  onClose: () => void
}

export const RewritePatchBanner = ({ patchId, onClose }: Props) => {
  const [banner, setBanner] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const removeBanner = async () => {
    setPreviewUrl('')
    setBanner(null)
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
      '/patch/banner',
      formData
    )
    kunErrorHandler(res, () => {
      setBanner(null)
      setPreviewUrl('')
    })
    toast.success('更新图片成功')
    setUpdating(false)
    onClose()
  }

  const onImageComplete = async (croppedImage: string) => {
    const imageBlob = dataURItoBlob(croppedImage)
    setPreviewUrl(URL.createObjectURL(imageBlob))
    setBanner(imageBlob)
  }

  return (
    <>
      <ModalBody>
        <KunImageCropper
          aspect={{ x: 16, y: 9 }}
          initialImage={previewUrl}
          description="您的预览图片将会被固定为 1920 × 1080 分辨率"
          onImageComplete={onImageComplete}
          removeImage={removeBanner}
        />

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
