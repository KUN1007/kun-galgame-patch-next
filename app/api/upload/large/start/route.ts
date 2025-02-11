import { NextResponse } from 'next/server'
import { S3Client, CreateMultipartUploadCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { UploadPartCommand } from '@aws-sdk/client-s3'
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

const startUploadSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  contentType: z.string()
})

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks

export async function POST(req: Request) {
  try {
    const user = await auth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fileName, fileSize, contentType } = startUploadSchema.parse(body)

    // Verify file size is over 100MB
    if (fileSize <= 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too small for multipart upload' },
        { status: 400 }
      )
    }

    // Check user quota
    const userTotalUploaded = await prisma.user.findUnique({
      where: { id: user.id },
      select: { totalUploaded: true }
    })

    if (!userTotalUploaded) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newTotal = userTotalUploaded.totalUploaded + BigInt(fileSize)
    if (newTotal > BigInt(100 * 1024 * 1024 * 1024)) {
      return NextResponse.json(
        { error: 'Storage quota exceeded' },
        { status: 400 }
      )
    }

    const key = `uploads/${user.id}/${Date.now()}-${fileName}`

    // Start multipart upload
    const createMultipartUploadCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: contentType
    })

    const { UploadId } = await s3Client.send(createMultipartUploadCommand)

    if (!UploadId) {
      throw new Error('Failed to start multipart upload')
    }

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        fileName,
        fileSize: BigInt(fileSize),
        key,
        userId: user.id
      }
    })

    // Generate presigned URLs for each part
    const numParts = Math.ceil(fileSize / CHUNK_SIZE)
    const presignedUrls = []

    for (let i = 0; i < numParts; i++) {
      const command = new UploadPartCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        UploadId,
        PartNumber: i + 1
      })

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600
      })

      const startByte = i * CHUNK_SIZE
      const endByte = Math.min(startByte + CHUNK_SIZE, fileSize)

      presignedUrls.push({
        url: presignedUrl,
        partNumber: i + 1,
        startByte,
        endByte
      })
    }

    return NextResponse.json({
      uploadId: upload.id,
      s3UploadId: UploadId,
      key,
      parts: presignedUrls
    })
  } catch (error) {
    console.error('Start multipart upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
