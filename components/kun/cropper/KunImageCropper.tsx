'use client'

import { useState } from 'react'
import { Button, Card, CardBody, Image } from '@nextui-org/react'
import { KunImageUploader } from './KunImageUploader'
import { KunImageCropperModal } from './KunImageCropperModal'
import { KunImageMosaicModal } from './KunImageMosaicModal'
import type { KunAspect } from './types'

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
  const [imgSrc, setImgSrc] = useState(initialImage ?? '')
  const [isCropperModalOpen, setIsCropperModalOpen] = useState(false)
  const [isMosaicToolOpen, setIsMosaicToolOpen] = useState(false)

  const handleCropComplete = (image: string) => {
    setImgSrc(image)
    onImageComplete?.(image)
  }

  const handleMosaicComplete = (mosaicImage: string) => {
    setImgSrc(mosaicImage)
    onImageComplete?.(mosaicImage)
  }

  const previewImage = imgSrc || initialImage

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
                setImgSrc('')
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
        onOpenMosaic={() => {
          setIsMosaicToolOpen(true)
        }}
        onClose={() => setIsCropperModalOpen(false)}
      />

      <KunImageMosaicModal
        isOpen={isMosaicToolOpen}
        imgSrc={imgSrc}
        onMosaicComplete={handleMosaicComplete}
        onClose={() => setIsMosaicToolOpen(false)}
      />
    </div>
  )
}
