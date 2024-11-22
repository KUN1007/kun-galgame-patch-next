'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, Button, Progress } from '@nextui-org/react'
import { Upload, File, Link } from 'lucide-react'
import axios from 'axios'

export default function FileUpload() {
  const [files, setFiles] = useState<
    Array<{
      file: File
      progress: number
      url?: string
      error?: string
    }>
  >([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0
    }))

    setFiles((prev) => [...prev, ...newFiles])

    for (const fileData of newFiles) {
      try {
        const { data } = await axios.post('/api/upload', {
          filename: fileData.file.name,
          fileType: fileData.file.type,
          fileSize: fileData.file.size
        })

        if (data.type === 'external') {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileData.file
                ? {
                    ...f,
                    error: 'Please provide a download link for files > 1GB'
                  }
                : f
            )
          )
          continue
        }

        if (data.type === 'onedrive') {
          // TODO: Implement OneDrive upload
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileData.file
                ? { ...f, error: 'OneDrive upload not implemented yet' }
                : f
            )
          )
          continue
        }

        // Handle S3 upload
        const formData = new FormData()
        Object.entries(data.fields).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
        formData.append('file', fileData.file)

        await axios.post(data.url, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 0)
            )
            setFiles((prev) =>
              prev.map((f) =>
                f.file === fileData.file ? { ...f, progress } : f
              )
            )
          }
        })

        const fileUrl = `${data.url}/${data.fields.key}`
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileData.file ? { ...f, url: fileUrl } : f
          )
        )
      } catch (error) {
        console.error('Upload error:', error)
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileData.file
              ? { ...f, error: 'Upload failed. Please try again.' }
              : f
          )
        )
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  })

  return (
    <div className="w-full max-w-3xl p-4 mx-auto">
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed ${
          isDragActive ? 'border-primary' : 'border-gray-300'
        } cursor-pointer`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <Upload className="w-12 h-12 text-gray-400" />
          <p className="text-lg text-center">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select files'}
          </p>
          <p className="text-sm text-gray-500">
            Files under 100MB will be uploaded to S3
            <br />
            Files between 100MB and 1GB will be uploaded to OneDrive
            <br />
            For files over 1GB, please provide a download link
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {files.map((fileData, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-4">
              <File className="w-6 h-6" />
              <div className="flex-1">
                <p className="font-medium">{fileData.file.name}</p>
                <p className="text-sm text-gray-500">{fileData.file.size}</p>
              </div>
              {fileData.url ? (
                <Button
                  as="a"
                  href={fileData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  endContent={<Link className="w-4 h-4" />}
                >
                  Download
                </Button>
              ) : fileData.error ? (
                <p className="text-red-500">{fileData.error}</p>
              ) : (
                <Progress
                  value={fileData.progress}
                  className="w-24"
                  size="sm"
                />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
