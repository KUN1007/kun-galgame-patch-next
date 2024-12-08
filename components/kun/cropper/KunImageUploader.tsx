'use client'

import { Button } from '@nextui-org/react'
import { Upload } from 'lucide-react'

interface ImageUploaderProps {
  onImageSelect: (dataUrl: string) => void
}

export const KunImageUploader = ({ onImageSelect }: ImageUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          onImageSelect(reader.result)
        }
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <Button
          as="span"
          color="primary"
          variant="flat"
          startContent={<Upload className="w-4 h-4" />}
        >
          上传图片
        </Button>
      </label>
    </div>
  )
}
