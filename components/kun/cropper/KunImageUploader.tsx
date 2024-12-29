'use client'

import toast from 'react-hot-toast'
import { useState } from 'react'
import { Button } from '@nextui-org/react'
import { Upload } from 'lucide-react'
import { cn } from '~/utils/cn'

interface ImageUploaderProps {
  onImageSelect: (dataUrl: string) => void
}

export const KunImageUploader = ({ onImageSelect }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File) => {
    if (!file) {
      toast.error('未检测到图片文件输入')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('您输入的文件不是图片格式')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        onImageSelect(reader.result)
      }
    })
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-4 text-center transition-colors  mb-4',
        isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center justify-center">
        <Upload className="w-12 h-12 mb-4 text-gray-400" />
        <p className="mb-2">拖放图片到此处或</p>
        <label htmlFor="image-upload">
          <Button
            as="span"
            color="primary"
            variant="flat"
            className="cursor-pointer"
          >
            选择文件
          </Button>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}
