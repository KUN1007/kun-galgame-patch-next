'use client'

import { useState } from 'react'
import { Button, Card, CardBody, Image } from '@nextui-org/react'
import { KunImageUploader } from './KunImageUploader'
import { KunImageCropperModal } from './KunImageCropperModal'
import type { KunAspect } from './types'
import { KunImageMosaicTool } from './KunImageMosaicTool'

interface Props {
  aspect?: KunAspect
  initialImage?: string
  description?: string
  onImageComplete?: (croppedImage: string) => void
  removeImage?: () => void
}

export const KunImageCropper = ({
  aspect,
  initialImage,
  description,
  onImageComplete,
  removeImage
}: Props) => {
  const [imgSrc, setImgSrc] = useState('')
  const [isCropperModalOpen, setIsCropperModalOpen] = useState(false)
  const [croppedImage, setCroppedImage] = useState<string>()
  const [pixelatedImage, setPixelatedImage] = useState<string>()
  const [isMosaicToolOpen, setIsMosaicToolOpen] = useState(false)
  const [needMosaic, setNeedMosaic] = useState(false)

  const handleCropComplete = (image: string) => {
    setCroppedImage(image)
    needMosaic ? setIsMosaicToolOpen(true) : onImageComplete?.(image)
  }

  const handleMosaicComplete = (mosaicImage: string) => {
    setPixelatedImage(mosaicImage)
    onImageComplete?.(mosaicImage)
  }

  const previewImage = needMosaic
    ? pixelatedImage || initialImage
    : croppedImage || initialImage

  return (
    <div className="gap-6 size-full">
      <KunImageUploader
        onImageSelect={(dataUrl: string) => {
          setImgSrc(dataUrl)
          setIsCropperModalOpen(true)
        }}
      />

      {previewImage && (
        <Card className="w-full max-w-md mx-auto">
          <CardBody>
            <Image
              src={previewImage}
              alt="Cropped image"
              className="object-contain w-full h-auto"
            />

            <Button
              color="danger"
              variant="bordered"
              size="sm"
              className="absolute z-10 right-2 top-2"
              onClick={() => {
                setCroppedImage('')
                setPixelatedImage('')
                removeImage?.()
              }}
            >
              移除
            </Button>
          </CardBody>
        </Card>
      )}

      <KunImageCropperModal
        isOpen={isCropperModalOpen}
        imgSrc={imgSrc}
        initialAspect={aspect}
        description={description}
        onCropComplete={handleCropComplete}
        onToggleNeedMosaic={setNeedMosaic}
        onClose={() => setIsCropperModalOpen(false)}
      />

      <KunImageMosaicTool
        isOpen={isMosaicToolOpen}
        imgSrc={croppedImage}
        description="您可以使用马赛克工具来隐藏敏感信息"
        onMosaicComplete={handleMosaicComplete}
        onClose={() => setIsMosaicToolOpen(false)}
      />
    </div>
  )
}
