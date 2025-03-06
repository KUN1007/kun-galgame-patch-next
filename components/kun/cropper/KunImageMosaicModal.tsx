'use client'

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@nextui-org/react'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { mosaicImg } from './utils'
import { KunMosaicController } from './KunMosaicController'

interface Props {
  isOpen: boolean
  imgSrc: string | undefined
  onMosaicComplete: (mosaicImage: string) => void
  onClose: () => void
}

export const KunImageMosaicModal: FC<Props> = ({
  isOpen,
  imgSrc,
  onMosaicComplete,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasStatesRef = useRef<{ isDrawing: boolean; isInit: boolean }>({
    isDrawing: false,
    isInit: true
  })
  const handleMouseDownRef = useRef<(() => void) | null>(null)
  const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null)
  const handleMouseUpRef = useRef<(() => void) | null>(null)

  const [canvasSize, setCanvasSize] = useState<{
    width: number
    height: number
  }>({
    width: 0,
    height: 0
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [mosaicSize, setMosaicSize] = useState(24)

  const image = useMemo(() => {
    if (typeof window === 'undefined' || !imgSrc) return undefined
    const img = new Image()
    img.onload = () => {
      setImageLoaded(true)
    }
    img.src = imgSrc
    return img
  }, [imgSrc])

  useEffect(() => {
    if (!image || !isOpen || !imageLoaded) {
      return
    }

    const container = containerRef.current
    if (!container) return

    const containerWidth = container.getBoundingClientRect().width
    const aspectRatio = image.width / image.height
    const targetHeight = containerWidth / aspectRatio

    setCanvasSize({ width: containerWidth, height: targetHeight })
  }, [isOpen, imageLoaded, image])

  const resetOriginalImage = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      0,
      0,
      canvas.width,
      canvas.height
    )
  }

  const generateMosaicCanvas = (originalCanvas: HTMLCanvasElement) => {
    const mosaicCanvas = document.createElement('canvas')
    mosaicCanvas.width = originalCanvas.width
    mosaicCanvas.height = originalCanvas.height
    const mosaicCtx = mosaicCanvas.getContext('2d', {
      willReadFrequently: true
    })
    return { mosaicCanvas, mosaicCtx }
  }

  const removeMosaicEventListeners = (canvas: HTMLCanvasElement) => {
    if (handleMouseDownRef.current) {
      canvas.removeEventListener('mousedown', handleMouseDownRef.current)
      handleMouseDownRef.current = null
    }
    if (handleMouseMoveRef.current) {
      canvas.removeEventListener('mousemove', handleMouseMoveRef.current)
      handleMouseMoveRef.current = null
    }
    if (handleMouseUpRef.current) {
      document.removeEventListener('mouseup', handleMouseUpRef.current)
      handleMouseUpRef.current = null
    }
  }

  const addMosaicEventListeners = (
    originalCanvas: HTMLCanvasElement,
    originalCtx: CanvasRenderingContext2D,
    mosaicCanvas: HTMLCanvasElement,
    mosaicCtx: CanvasRenderingContext2D,
    mosaicImageData: ImageData
  ) => {
    removeMosaicEventListeners(originalCanvas)

    const handleMouseDown = () => {
      canvasStatesRef.current.isDrawing = true
    }

    const handleMouseUp = () => {
      canvasStatesRef.current.isDrawing = false
      canvasStatesRef.current.isInit = true
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasStatesRef.current.isDrawing) return

      mosaicCtx.globalCompositeOperation = 'source-over'
      mosaicCtx.putImageData(mosaicImageData, 0, 0)
      mosaicCtx.globalCompositeOperation = 'destination-in'

      const { left, top } = originalCanvas.getBoundingClientRect()
      const mouseX = e.clientX - left
      const mouseY = e.clientY - top

      if (canvasStatesRef.current.isInit) {
        mosaicCtx.beginPath()
        mosaicCtx.moveTo(mouseX, mouseY)
        canvasStatesRef.current.isInit = false
      }
      mosaicCtx.lineTo(mouseX, mouseY)
      mosaicCtx.lineWidth = mosaicSize
      mosaicCtx.lineCap = 'round'
      mosaicCtx.lineJoin = 'round'
      mosaicCtx.stroke()

      originalCtx.drawImage(mosaicCanvas, 0, 0)
    }

    originalCanvas.addEventListener('mousedown', handleMouseDown)
    originalCanvas.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    handleMouseDownRef.current = handleMouseDown
    handleMouseMoveRef.current = handleMouseMove
    handleMouseUpRef.current = handleMouseUp
  }

  const resetCanvas = () => {
    if (!image || !imageLoaded || !canvasSize.width || !canvasSize.height) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      return
    }

    const { mosaicCanvas, mosaicCtx } = generateMosaicCanvas(canvas)
    if (!mosaicCtx) {
      return
    }

    resetOriginalImage(canvas, ctx, image)

    const originalImageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    )

    const mosaicImageData = mosaicImg(
      originalImageData,
      canvas.width,
      canvas.height,
      mosaicSize
    )

    addMosaicEventListeners(
      canvas,
      ctx,
      mosaicCanvas,
      mosaicCtx,
      mosaicImageData
    )
  }

  useEffect(() => {
    if (!isOpen || !imageLoaded) {
      return
    }

    resetCanvas()

    return () => {
      if (canvasRef.current) {
        removeMosaicEventListeners(canvasRef.current)
      }
    }
  }, [mosaicSize, isOpen, imageLoaded, canvasSize])

  const handleMosaicComplete = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    onMosaicComplete(canvas.toDataURL('image/webp'))
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex-col">
          <h2>图片打码</h2>
          <p className="font-medium text-medium">
            使用 光标涂抹 来为图片添加马赛克
          </p>
        </ModalHeader>
        <ModalBody>
          <div ref={containerRef} className="flex flex-col items-center gap-4">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="cursor-crosshair"
            />
            <KunMosaicController
              mosaicSize={mosaicSize}
              onMosaicSizeChange={setMosaicSize}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          <Button color="primary" onPress={handleMosaicComplete}>
            完成
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
