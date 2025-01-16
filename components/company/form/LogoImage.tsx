'use client'

import { useEffect, useState } from 'react'
import localforage from 'localforage'
import { dataURItoBlob } from '~/utils/dataURItoBlob'
import { KunImageCropper } from '~/components/kun/cropper/KunImageCropper'
import { LOGO_KEY } from '~/constants/company'

export const LogoImage = () => {
  const [initialUrl, setInitialUrl] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      const localeBannerBlob: Blob | null = await localforage.getItem(LOGO_KEY)
      if (localeBannerBlob) {
        setInitialUrl(URL.createObjectURL(localeBannerBlob))
      }
    }
    fetchData()
  }, [])

  const removeBanner = async () => {
    await localforage.removeItem(LOGO_KEY)
    setInitialUrl('')
  }

  const onImageComplete = async (croppedImage: string) => {
    const imageBlob = dataURItoBlob(croppedImage)
    console.log('imageBlob', imageBlob)
    await localforage.setItem(LOGO_KEY, imageBlob)
  }

  return (
    <KunImageCropper
      initialImage={initialUrl}
      description="请选择对应会社的 logo 图标"
      onImageComplete={onImageComplete}
      removeImage={removeBanner}
    />
  )
}
