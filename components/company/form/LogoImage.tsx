'use client'

import type { FC } from 'react'
import { dataURItoBlob } from '~/utils/dataURItoBlob'
import { KunImageCropper } from '~/components/kun/cropper/KunImageCropper'

interface Props {
  initialUrl: string
  setInitialUrl: (url: string) => void
  setImageBlob: (imageBlob: Blob | null) => void
}

export const LogoImage: FC<Props> = ({
  initialUrl,
  setInitialUrl,
  setImageBlob
}) => {
  const handleImageComplete = async (croppedImage: string) => {
    const imageBlob = dataURItoBlob(croppedImage)
    setInitialUrl('')
    setImageBlob(imageBlob)
  }

  const removeImage = () => {
    setInitialUrl('')
    setImageBlob(null)
  }

  return (
    <KunImageCropper
      initialImage={initialUrl}
      description="请选择对应会社的 logo 图标"
      onImageComplete={handleImageComplete}
      removeImage={removeImage}
    />
  )
}
