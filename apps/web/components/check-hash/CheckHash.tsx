'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { blake3 } from '@noble/hashes/blake3.js'
import * as utils from '@noble/hashes/utils.js'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Progress,
  Input,
  Textarea
} from '@heroui/react'
import { FileIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { cn } from '~/utils/cn'
import toast from 'react-hot-toast'

const { bytesToHex } = utils

export const CheckHash = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hashValue, setHashValue] = useState(searchParams.get('hash') || '')
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'match' | 'mismatch'
  >('idle')
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentValue = searchParams.get('content') || ''

  useEffect(() => {
    const newHash = searchParams.get('hash') || ''
    setHashValue(newHash)
  }, [searchParams])

  const updateHash = useCallback(
    (value: string) => {
      setHashValue(value)
      const newUrl = value ? `/check-hash?hash=${value}` : '/check-hash'
      router.push(newUrl)
    },
    [router]
  )

  const verifyFile = useCallback(
    async (file: File) => {
      setStatus('checking')
      setProgress(0)

      const chunkSize = 64 * 1024
      const fileSize = file.size
      const hashInstance = blake3.create({})
      let bytesProcessed = 0

      const processChunk = async (start: number) => {
        const end = Math.min(start + chunkSize, fileSize)
        const chunk = await file.slice(start, end).arrayBuffer()
        const uint8Array = new Uint8Array(chunk)

        hashInstance.update(uint8Array)
        bytesProcessed += uint8Array.byteLength

        const newProgress = Math.round((bytesProcessed / fileSize) * 100)
        setProgress(newProgress)

        if (end < fileSize) {
          await new Promise((resolve) => setTimeout(resolve, 0))
          await processChunk(end)
        } else {
          const hash = bytesToHex(hashInstance.digest())
          setStatus(
            hash.toLowerCase() === hashValue.toLowerCase()
              ? 'match'
              : 'mismatch'
          )
        }
      }

      try {
        await processChunk(0)
      } catch (error) {
        toast(`校验文件错误! ${error}`)
        setStatus('mismatch')
      }
    },
    [hashValue]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) verifyFile(file)
    },
    [verifyFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) verifyFile(file)
    },
    [verifyFile]
  )

  return (
    <Card className="max-w-2xl p-8 mx-auto">
      <CardHeader className="flex flex-col space-y-16">
        {contentValue && (
          <Textarea
            isReadOnly
            label="资源链接"
            labelPlacement="outside"
            value={contentValue}
            size="lg"
            variant="flat"
          />
        )}
        <Input
          label="BLAKE3 Hash"
          labelPlacement="outside"
          value={hashValue}
          onChange={(e) => updateHash(e.target.value)}
          size="lg"
          variant="bordered"
          description="您可以输入文件 BLAKE3 Hash 值以进行校验 (如果您是从本站跳转, 本站会为您自动补全 Hash)"
        />
      </CardHeader>
      <CardBody>
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center transition-colors mb-4',
            isDragging ? 'border-primary bg-primary/10' : 'border-default-300'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FileIcon className="w-12 h-12 mx-auto mb-4 text-default-400" />
          <p className="mb-2">拖动或点击以上传文件</p>
          <Button
            onPress={() => fileInputRef.current?.click()}
            color="primary"
            variant="flat"
          >
            选择文件
          </Button>
        </div>

        {status === 'checking' && (
          <div className="mt-6">
            <Progress
              label="检查进度"
              size="md"
              value={progress}
              color="primary"
              showValueLabel={true}
              className="max-w-md mx-auto"
            />
            <p className="mt-2 text-center text-default-500">
              正在校验文件 Hash...
            </p>
          </div>
        )}

        {status === 'match' && (
          <div className="flex items-center justify-center gap-2 mt-6 text-success">
            <CheckCircle2Icon className="w-6 h-6" />
            <span>校验成功! Hash 一致, 文件未损坏🎉🎉🎉</span>
          </div>
        )}

        {status === 'mismatch' && (
          <div className="flex items-center justify-center gap-2 mt-6 text-danger">
            <XCircleIcon className="w-6 h-6" />
            <span>校验失败! 文件可能在下载过程中损坏!</span>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
