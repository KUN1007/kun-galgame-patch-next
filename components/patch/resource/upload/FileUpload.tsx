'use client'

import { useState } from 'react'
import { Card, Button, Progress, Input } from '@nextui-org/react'
import { Upload, File as FileIcon, ExternalLink } from 'lucide-react'
import axios from 'axios'
import { cn } from '~/utils/cn'

interface FileStatus {
  file: File
  progress: number
  error?: string
}

export const FileUpload = () => {
  const [fileData, setFileData] = useState<FileStatus | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = async (file: File) => {
    if (!file) return

    setFileData({ file, progress: 0 })

    const formData = new FormData()
    formData.append('file', file)

    const res = await axios.post('/api/upload/resource', formData, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 0)
        )
        setFileData((prev) => (prev ? { ...prev, progress } : null))
      }
    })

    // setFileData((prev) => (prev ? { ...prev, url: data.url } : null))
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
    <div className="w-full max-w-3xl p-4 mx-auto">
      <Card className="w-full">
        <div className="p-6">
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
              <div className="flex items-center gap-4">
                <FileIcon className="w-6 h-6 text-primary/60" />
                <div className="flex-1">
                  <p className="font-medium truncate">{fileData.file.name}</p>
                  <p className="text-sm text-gray-500">{fileData.file.size}</p>
                </div>
                {fileData.url ? (
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      variant="flat"
                      as="a"
                      href={fileData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      endContent={<ExternalLink className="w-4 h-4" />}
                    >
                      Download
                    </Button>
                    <Button color="danger" variant="light" onClick={removeFile}>
                      Remove
                    </Button>
                  </div>
                ) : fileData.error ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-red-500">{fileData.error}</p>
                    <Button color="danger" variant="light" onClick={removeFile}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Progress
                    value={fileData.progress}
                    className="w-24"
                    size="sm"
                    color="primary"
                  />
                )}
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  )
}
