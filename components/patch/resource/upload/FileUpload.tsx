'use client'

import { useState } from 'react'
import {
  Card,
  Button,
  Progress,
  Input,
  Chip,
  CardBody
} from '@nextui-org/react'
import { Upload, File as FileIcon } from 'lucide-react'
import axios from 'axios'
import { cn } from '~/utils/cn'
import toast from 'react-hot-toast'

interface FileStatus {
  file: File
  progress: number
  error?: string
  filename?: string
}

export const FileUpload = () => {
  const [fileData, setFileData] = useState<FileStatus | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = async (file: File) => {
    if (!file) return

    setFileData({ file, progress: 0 })

    const formData = new FormData()
    formData.append('file', file)

    const res = await axios.post<string>('/api/upload/resource', formData, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 0)
        )
        setFileData((prev) => (prev ? { ...prev, progress } : null))
      }
    })

    if (res.status !== 200) {
      toast.error(res.statusText)
      return
    }

    setFileData((prev) => (prev ? { ...prev, filename: res.data } : null))
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleFile(file)
    }
  }

  const removeFile = () => {
    setFileData(null)
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardBody>
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
                onChange={handleFileInput}
                accept="*/*"
              />
            </label>
            <div className="space-y-1 text-sm text-center text-gray-500">
              <p>✓ 100MB 以下的文件将会被上传到 S3 对象存储</p>
              <p>✓ 100MB ~ 1GB 的文件将会被上传到 OneDrive 存储</p>
              <p>✓ 若文件超过 1GB, 请您自行提供下载链接</p>
            </div>
          </div>
        </div>

        {fileData && (
          <Card className="p-4 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileIcon className="w-6 h-6 text-primary/60" />
                <div className="flex-1">
                  <p className="font-medium truncate">
                    {fileData.file.name.slice(0, 20)}
                  </p>
                  <p className="text-sm text-default-500">
                    {fileData.file.size}
                  </p>
                </div>
              </div>
              {fileData.filename ? (
                <div className="flex items-center gap-2">
                  <Chip color="success">上传成功</Chip>
                  <Button color="danger" variant="flat" onClick={removeFile}>
                    移除
                  </Button>
                </div>
              ) : fileData.error ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-danger-500">{fileData.error}</p>
                  <Button color="danger" variant="light" onClick={removeFile}>
                    移除
                  </Button>
                </div>
              ) : (
                <Progress
                  value={fileData.progress}
                  className="w-24"
                  size="sm"
                  color="primary"
                  aria-label={`上传进度: ${fileData.progress}%`}
                />
              )}
            </div>
          </Card>
        )}
      </CardBody>
    </Card>
  )
}
