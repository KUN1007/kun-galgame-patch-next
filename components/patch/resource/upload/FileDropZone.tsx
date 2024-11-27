import toast from 'react-hot-toast'
import { Upload } from 'lucide-react'
import { Button, Input } from '@nextui-org/react'
import { cn } from '~/utils/cn'
import { useState } from 'react'
import { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } from '~/constants/resource'

interface Props {
  onFileUpload: (file: File) => Promise<void>
}

const validateFileType = (file: File): boolean => {
  const fileExtension = file.name
    .slice(file.name.lastIndexOf('.'))
    .toLowerCase()
  return (
    ALLOWED_MIME_TYPES.includes(file.type) ||
    ALLOWED_EXTENSIONS.includes(fileExtension)
  )
}

const handleFileInput = (file: File | undefined) => {
  if (!file) {
    toast.error('未选择文件')
    return
  }

  if (!validateFileType(file)) {
    toast.error('文件类型不被支持，仅接受 .zip, .rar, .7z 格式')
    return
  }

  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > 100) {
    toast.error(
      `文件大小超出限制: ${fileSizeMB.toFixed(3)} MB, 最大允许大小为 100 MB`
    )
    return
  }

  return file
}

export const FileDropZone = ({ onFileUpload }: Props) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]

    const res = handleFileInput(file)

    if (res) {
      await onFileUpload(res)
    }
  }

  const handleClickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const res = handleFileInput(file)
    if (res) {
      await onFileUpload(res)
    }
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 transition-colors',
        isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
      )}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <Upload className="w-12 h-12 text-primary/60" />
        <p className="text-lg font-medium text-center">
          {isDragging ? '拖动文件到此处' : '拖动或点击以上传文件'}
        </p>
        <label>
          <Button color="primary" variant="flat" as="span">
            选择文件
          </Button>
          <Input
            type="file"
            className="hidden"
            onChange={handleClickUpload}
            accept="*/*"
          />
        </label>
      </div>
    </div>
  )
}
