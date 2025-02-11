'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

const uploadFormSchema = z.object({
  file: z.instanceof(File)
})

type UploadFormValues = z.infer<typeof uploadFormSchema>

export default function UploadPage() {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema)
  })

  const uploadSmallFile = async (file: File) => {
    // Request upload URL
    const response = await fetch('/api/upload/small', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get upload URL')
    }

    const uploadData = await response.json()

    // Upload file directly
    const formData = new FormData()
    Object.entries(uploadData.fields).forEach(([key, value]) => {
      formData.append(key, value as string)
    })
    formData.append('file', file)

    const uploadResponse = await fetch(uploadData.url, {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error('Upload failed')
    }

    setProgress(100)

    // Complete upload
    await fetch('/api/upload/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId: uploadData.uploadId
      })
    })
  }

  const uploadLargeFile = async (file: File) => {
    // Start multipart upload
    const startResponse = await fetch('/api/upload/large/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type
      })
    })

    if (!startResponse.ok) {
      throw new Error('Failed to start upload')
    }

    const { uploadId, s3UploadId, key, parts } = await startResponse.json()

    // Upload parts
    const uploadedParts = []
    const chunkSize = 10 * 1024 * 1024 // 10MB chunks

    for (let i = 0; i < parts.length; i++) {
      const { url, startByte, endByte, partNumber } = parts[i]
      const chunk = file.slice(startByte, endByte)

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: chunk,
        headers: {
          'Content-Type': file.type,
          'Content-Length': chunk.size.toString()
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload part ${partNumber}`)
      }

      uploadedParts.push({
        ETag: uploadResponse.headers.get('ETag')?.replace(/"/g, '') || '',
        PartNumber: partNumber
      })

      setProgress(((i + 1) * 100) / parts.length)
    }

    // Complete multipart upload
    const completeResponse = await fetch('/api/upload/large/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId,
        s3UploadId,
        key,
        parts: uploadedParts
      })
    })

    if (!completeResponse.ok) {
      throw new Error('Failed to complete upload')
    }
  }

  const onSubmit = async (data: UploadFormValues) => {
    try {
      setIsUploading(true)
      const file = data.file

      if (file.size <= 100 * 1024 * 1024) {
        await uploadSmallFile(file)
      } else {
        await uploadLargeFile(file)
      }

      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-xl mx-auto">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-6">
            <Upload className="w-12 h-12 text-primary" />
          </div>

          <h1 className="mb-6 text-2xl font-bold text-center">Upload Files</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input type="file" {...register('file')} disabled={isUploading} />
              {errors.file && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.file.message}
                </p>
              )}
            </div>

            {progress > 0 && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-500">
                  {Math.round(progress)}% uploaded
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
