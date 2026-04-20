'use client'

import { useEffect, useRef } from 'react'
import type { KunCaptchaImage } from './captcha'

interface CaptchaCanvasProps {
  image: KunCaptchaImage
  isSelected: boolean
  onSelect: () => void
}

export const KunCaptchaCanvas = ({
  image,
  isSelected,
  onSelect
}: CaptchaCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = image.data
    img.onload = () => {
      canvas.width = 256
      canvas.height = 256
      ctx.drawImage(img, 0, 0, 256, 256)

      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 122, 255, 0.1)'
        ctx.fillRect(0, 0, 256, 256)
      }
    }
  }, [image.data, isSelected])

  return (
    <div
      onClick={onSelect}
      className={`w-full h-full p-1 cursor-pointer rounded-2xl transition-all ${
        isSelected ? 'ring-4 ring-primary-300' : ''
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full rounded-2xl" />
    </div>
  )
}
