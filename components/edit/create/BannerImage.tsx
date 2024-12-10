'use client'

import { useEffect, useState } from 'react'
import localforage from 'localforage'
import { dataURItoBlob } from '~/utils/dataURItoBlob'
import { resizeImage } from '~/utils/resizeImage'
import { KunImageCropper } from '~/components/kun/cropper/KunImageCropper'

interface Props {
  errors: string | undefined
}

export const BannerImage = ({ errors }: Props) => {
  const [initialUrl, setInitialUrl] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      const localeBannerBlob: Blob | null =
        await localforage.getItem('kun-patch-banner')
      if (localeBannerBlob) {
        setInitialUrl(URL.createObjectURL(localeBannerBlob))
      }
    }
    fetchData()
  }, [])

  const removeBanner = async () => {
    await localforage.removeItem('kun-patch-banner')
    setInitialUrl('')
  }

  const onCropComplete = async (croppedImage: string) => {
    const imageBlob = dataURItoBlob(croppedImage)
    // const imageFile = new File([imageBlob], 'banner.webp', {
    //   type: imageBlob.type
    // })
    // const miniImage = await resizeImage(imageFile, 1920, 1080)
    await localforage.setItem('kun-patch-banner', imageBlob)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">预览图片 (必须)</p>
      {errors && <p className="text-xs text-danger-500">{errors}</p>}

      <KunImageCropper
        aspect={{ x: 16, y: 9 }}
        initialImage={initialUrl}
        description="您的预览图片将会被固定为 1920 × 1080 分辨率"
        onCropComplete={onCropComplete}
        removeImage={removeBanner}
      />
    </div>
  )
}
