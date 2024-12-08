'use client'

import { useState, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@nextui-org/react'
import { KunCropControls } from './KunCropControls'
import { centerAspectCrop, createCroppedImage } from './utils'
import type { KunAspect } from './types'
import 'react-image-crop/dist/ReactCrop.css'

interface Props {
  isOpen: boolean
  imgSrc: string
  initialAspect?: KunAspect
  onCropComplete?: (croppedImage: string) => void
  onClose: () => void
}

export const KunImageCropperModal = ({
  isOpen,
  imgSrc,
  onClose,
  initialAspect = { x: 16, y: 9 },
  onCropComplete
}: Props) => {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState<{ x: number; y: number }>(initialAspect)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect.x / aspect.y))
    }
  }

  const handleToggleAspect = () => {
    setAspect(aspect)
  }

  const handleCropComplete = async () => {
    if (completedCrop && imgRef.current) {
      const croppedImage = await createCroppedImage(
        imgRef.current,
        completedCrop,
        scale,
        rotate
      )
      onCropComplete?.(croppedImage)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>裁剪图片</ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center gap-4">
            {!!imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect.x / aspect.y}
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                  onLoad={onImageLoad}
                  className="max-h-[60vh] object-contain"
                />
              </ReactCrop>
            )}

            <KunCropControls
              scale={scale}
              rotate={rotate}
              aspect={aspect}
              onScaleChange={setScale}
              onRotateChange={setRotate}
              onAspectToggle={handleToggleAspect}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          <Button color="primary" onPress={handleCropComplete}>
            裁剪图片
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
