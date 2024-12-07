'use client'

import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Link
} from '@nextui-org/react'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { KunCaptchaCanvas } from './CaptchaCanvas'
import { KunLoading } from '../Loading'
import { kunCaptchaErrorMessageMap } from '~/constants/captcha'
import type { KunCaptchaImage } from './captcha'

interface CaptchaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (code: string) => void
}

export const KunCaptchaModal = ({
  isOpen,
  onClose,
  onSuccess
}: CaptchaModalProps) => {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [images, setImages] = useState<KunCaptchaImage[]>([])
  const [sessionId, setSessionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      loadCaptcha()
    }
  }, [isOpen])

  const loadCaptcha = async () => {
    if (errorCount < 6) {
      setErrorCount((prev) => prev + 1)
    }

    setLoading(true)
    const { images, sessionId } = await kunFetchGet<{
      images: KunCaptchaImage[]
      sessionId: string
    }>('/auth/captcha')

    setImages(images)
    setSessionId(sessionId)
    setSelectedImages(new Set())

    setLoading(false)
  }

  const toggleImageSelection = (id: string) => {
    const newSelection = new Set(selectedImages)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedImages(newSelection)
  }

  const handleVerify = async () => {
    const response = await kunFetchPost<KunResponse<{ code: string }>>(
      '/auth/captcha',
      { sessionId, selectedIds: Array.from(selectedImages) }
    )
    if (typeof response === 'string') {
      toast.error(kunCaptchaErrorMessageMap[errorCount])
      loadCaptcha()
    } else {
      onSuccess(response.code)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex-col">
          <h3 className="text-lg">验证</h3>
          <p className="font-medium">请选择下面所有的 白毛 女孩子</p>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <KunLoading hint="正在加载验证..." />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.map((image) => (
                <div key={image.id} className="aspect-square">
                  <KunCaptchaCanvas
                    image={image}
                    isSelected={selectedImages.has(image.id)}
                    onSelect={() => toggleImageSelection(image.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="flex-col">
          <p className="text-sm">
            由{' '}
            <Link
              size="sm"
              isExternal
              showAnchorIcon
              href="https://sticker.kungal.com"
            >
              鲲 Galgame 表情包
            </Link>{' '}
            提供技术支持
          </p>

          <div className="ml-auto space-x-2">
            <Button color="danger" variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleVerify}
              isDisabled={selectedImages.size === 0}
            >
              确定
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
