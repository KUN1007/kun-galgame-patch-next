'use client'

import { useState } from 'react'
import { Card, CardBody, Image, Button } from '@nextui-org/react'
import { KunImageUploader } from './KunImageUploader'
import { KunImageCropperModal } from './KunImageCropperModal'
import type { KunAspect } from './types'

interface Props {
  aspect?: KunAspect
  initialImage?: string
  onCropComplete?: (croppedImage: string) => void
  removeImage?: () => void
}

export const KunImageCropper = ({
  aspect,
  initialImage,
  onCropComplete,
  removeImage
}: Props) => {
  const [imgSrc, setImgSrc] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [croppedImage, setCroppedImage] = useState<string>()

  const handleCropComplete = (image: string) => {
    setCroppedImage(image)
    onCropComplete?.(image)
  }

  const previewImage = croppedImage ? croppedImage : initialImage

  return (
    <div className="gap-6 size-full">
      <KunImageUploader
        onImageSelect={(dataUrl: string) => {
          setImgSrc(dataUrl)
          setIsModalOpen(true)
        }}
      />

      {previewImage && (
        <Card className="w-full max-w-md mx-auto">
          <CardBody>
            <Image
              src={croppedImage || initialImage}
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
                removeImage?.()
              }}
            >
              移除
            </Button>
          </CardBody>
        </Card>
      )}

      <KunImageCropperModal
        isOpen={isModalOpen}
        imgSrc={imgSrc}
        onClose={() => setIsModalOpen(false)}
        initialAspect={aspect}
        onCropComplete={handleCropComplete}
      />
    </div>
  )
}
