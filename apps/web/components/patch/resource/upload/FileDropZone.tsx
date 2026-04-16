import { Upload } from 'lucide-react'
import { Button, Input } from '@heroui/react'
import { cn } from '~/utils/cn'
import { useState, useRef } from 'react'
import { useUserStore } from '~/store/userStore'
import { handleFileInput } from './utils'

interface Props {
  onFileUpload: (file: File) => Promise<void>
}

export const FileDropZone = ({ onFileUpload }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const user = useUserStore((state) => state.user)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]

    const res = handleFileInput(file, user.role)

    if (res) {
      await onFileUpload(res)
    }
  }

  const handleClickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const res = handleFileInput(file, user.role)
    if (res) {
      await onFileUpload(res)
    }
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 transition-colors',
        isDragging ? 'border-primary bg-primary/10' : 'border-default-300'
      )}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <Upload className="size-12 text-primary/60" />
        <p className="text-lg font-medium text-center">
          {isDragging ? '拖动文件到此处' : '拖动或点击以上传文件'}
        </p>
        <label>
          <Button
            color="primary"
            variant="flat"
            onPress={() => fileInputRef.current?.click()}
          >
            选择文件
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleClickUpload}
            accept="*/*"
          />
        </label>
        <p className="text-sm text-default-500">
          我们支持 .zip .7z .rar 压缩格式, 由于不会发生资源失效,
          请您根据自身需求设置解压密码
        </p>
      </div>
    </div>
  )
}
