'use client'

import { useState } from 'react'
import { Card, Button, Progress, Input } from '@nextui-org/react'
import { Upload, File as FileIcon } from 'lucide-react'
import axios from 'axios'
import { cn } from '~/utils/cn'
import toast from 'react-hot-toast'
import type { UploadFileResponse } from '~/types/api/upload'
import type { FileStatus } from '../share'

interface Props {
  onSuccess: (
    storage: string,
    hash: string,
    content: string,
    size: string
  ) => void
  handleRemoveFile: () => void
}

export const FileUpload = ({ onSuccess, handleRemoveFile }: Props) => {
  const [fileData, setFileData] = useState<FileStatus | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = async (file: File) => {
    if (!file) {
      return
    }

    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > 100) {
      toast.error(
        `文件大小超出限制: ${fileSizeMB.toFixed(3)} MB, 最大允许大小为 100 MB`
      )
      return
    }

    setFileData({ file, progress: 0 })

    const formData = new FormData()
    formData.append('file', file)

    const res = await axios.post<UploadFileResponse>(
      '/api/upload/resource',
      formData,
      {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 0)
          )
          setFileData((prev) => (prev ? { ...prev, progress } : null))
        }
      }
    )

    if (res.status !== 200) {
      toast.error(res.statusText)
      return
    }

    const { filetype, fileHash, fileSize } = res.data

    setFileData((prev) =>
      prev
        ? { ...prev, hash: res.data.fileHash, filetype: res.data.filetype }
        : null
    )
    onSuccess(filetype, fileHash, `https://www.moyu.moe/${fileHash}`, fileSize)
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
    handleRemoveFile()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">上传资源</h3>

      {!fileData && (
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
          </div>
        </div>
      )}

      {fileData && (
        <Card className="p-4 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileIcon className="w-6 h-6 text-primary/60" />
              <div className="flex-1">
                <p className="font-medium truncate">
                  {fileData.file.name.slice(0, 20)}
                </p>
                <p className="text-sm text-default-500">{fileData.file.size}</p>
              </div>
            </div>
            {fileData.hash ? (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-default-500">文件上传成功</span>
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
    </div>
  )
}
