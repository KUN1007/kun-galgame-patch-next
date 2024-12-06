import React, { useRef, useState } from 'react'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@nextui-org/react'
import { useUserStore } from '~/store/providers/user'
import { Camera } from 'lucide-react'
import { dataURItoBlob } from '~/utils/dataURItoBlob'
import { kunFetchFormData } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import toast from 'react-hot-toast'

export const AvatarCrop = () => {
  const { user, setUser } = useUserStore((state) => state)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [crop, setCrop] = useState<Crop>()
  const [image, setImage] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImage(reader.result as string)
        onOpen()
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const getCroppedImg = async () => {
    if (!crop || !imageRef.current) return

    const canvas = document.createElement('canvas')
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height

    canvas.width = crop.width
    canvas.height = crop.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    const base64Image = canvas.toDataURL('image/webp', 0.77)
    const avatarBlob = dataURItoBlob(base64Image)

    const formData = new FormData()
    formData.append('avatar', avatarBlob)

    setLoading(true)
    const res = await kunFetchFormData<KunResponse<{ avatar: string }>>(
      '/user/setting/avatar',
      formData
    )
    if (typeof res === 'string') {
      toast.error(res)
    } else {
      setLoading(false)
      toast.success('更新头像成功!')
      setCroppedImage(base64Image)
      setUser({ ...user, avatar: res.avatar })
      onClose()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="group relative cursor-pointer">
        <div className="group relative">
          {croppedImage ? (
            <img
              src={croppedImage}
              alt="Cropped avatar"
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <Avatar
              name={user.name}
              src={user.avatar}
              className="size-16"
              color="primary"
            />
          )}

          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Camera className="size-6 text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onSelectFile}
          />
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} placement="center" size="2xl">
        <ModalContent>
          <ModalHeader>裁剪头像</ModalHeader>
          <ModalBody className="flex items-center justify-center">
            {image && (
              <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={1}>
                <img
                  ref={imageRef}
                  src={image}
                  alt="Upload"
                  className="max-h-[60vh] w-auto"
                />
              </ReactCrop>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="primary"
              onPress={getCroppedImg}
              isLoading={loading}
              disabled={loading}
            >
              确定
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
