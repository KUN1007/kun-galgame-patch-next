import { NextResponse } from 'next/server'
import { S3Client, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3'
import { prisma } from '~/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const completeUploadSchema = z.object({
  uploadId: z.string(),
  s3UploadId: z.string(),
  key: z.string(),
  parts: z.array(
    z.object({
      ETag: z.string(),
      PartNumber: z.number()
    })
  )
})

export async function POST(req: Request) {
  try {
    const user = await auth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { uploadId, s3UploadId, key, parts } =
      completeUploadSchema.parse(body)

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId }
    })

    if (!upload || upload.userId !== user.id) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      UploadId: s3UploadId,
      MultipartUpload: { Parts: parts }
    })

    await s3Client.send(completeCommand)

    // Update upload status and user's total uploaded size
    await prisma.$transaction([
      prisma.upload.update({
        where: { id: uploadId },
        data: { status: 'completed' }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          totalUploaded: {
            increment: upload.fileSize
          }
        }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Complete multipart upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
