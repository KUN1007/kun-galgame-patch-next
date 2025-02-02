import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { rm } from 'fs/promises'
import { dirname } from 'path'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  endpoint: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_ENDPOINT!,
  region: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_REGION!,
  credentials: {
    accessKeyId: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_SECRET_ACCESS_KEY!
  }
})

const CHUNK_SIZE = 5 * 1024 * 1024
const MAX_CONCURRENT_UPLOADS = 4

export const uploadLargeFileToS3 = async (key: string, filePath: string) => {
  const bucket = process.env.KUN_VISUAL_NOVEL_S3_STORAGE_BUCKET_NAME!

  try {
    const fileStats = await stat(filePath)
    const fileSize = fileStats.size

    const multipartUpload = await s3.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: 'application/octet-stream'
      })
    )

    const uploadId = multipartUpload.UploadId
    if (!uploadId) {
      return '上传过程错误, 未找到 S3 Upload ID'
    }

    const totalParts = Math.ceil(fileSize / CHUNK_SIZE)
    const uploadPromises: Promise<{ PartNumber: number; ETag: string }>[] = []
    const completedParts: { PartNumber: number; ETag: string }[] = []

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, fileSize)

      const uploadPartPromise = (async () => {
        const fileStream = createReadStream(filePath, { start, end: end - 1 })

        const uploadPartCommand = new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: fileStream
        })

        const response = await s3.send(uploadPartCommand)
        console.log(response)

        return {
          PartNumber: partNumber,
          ETag: response.ETag!
        }
      })()

      uploadPromises.push(uploadPartPromise)

      if (
        uploadPromises.length >= MAX_CONCURRENT_UPLOADS ||
        partNumber === totalParts
      ) {
        const results = await Promise.all(uploadPromises)
        completedParts.push(...results)
        uploadPromises.length = 0
      }
    }

    await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: completedParts.sort((a, b) => a.PartNumber - b.PartNumber)
        }
      })
    )

    const folderPath = dirname(filePath)
    await rm(folderPath, { recursive: true, force: true })

    return {}
  } catch (error) {
    if (error instanceof Error && 'uploadId' in error) {
      await s3.send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: (error as any).uploadId
        })
      )
    }
    return '上传过程发生错误, 已终止上传过程'
  }
}

export const deleteFileFromS3 = async (key: string) => {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_BUCKET_NAME!,
    Key: key
  })
  await s3.send(deleteCommand)
}
