'use client'

import { useState } from 'react'
import { Card, CardBody, Image } from '@nextui-org/react'
import { KunImageUploader } from './KunImageUploader'
import { KunImageCropperModal } from './KunImageCropperModal'
import type { KunAspect } from './types'

interface Props {
  aspect?: KunAspect
  onCropComplete?: (croppedImage: string) => void
}

export const KunImageCropper = ({ aspect, onCropComplete }: Props) => {
  const [imgSrc, setImgSrc] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [croppedImage, setCroppedImage] = useState<string>()

  const handleCropComplete = (image: string) => {
    setCroppedImage(image)
    onCropComplete?.(image)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <KunImageUploader
        onImageSelect={(dataUrl: string) => {
          setImgSrc(dataUrl)
          setIsModalOpen(true)
        }}
      />

      {croppedImage && (
        <Card className="w-full max-w-md">
          <CardBody>
            <Image
              src={croppedImage}
              alt="Cropped image"
              className="object-contain w-full h-auto"
            />
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
