import { NextResponse } from 'next/server'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_ENDPOINT!,
  region: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_REGION!,
  credentials: {
    accessKeyId: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_SECRET_ACCESS_KEY!
  }
})

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json('success', { status: 500 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = join(process.cwd(), 'uploads', file.name)

  await writeFile(filePath, buffer)

  await s3.send(
    new PutObjectCommand({
      Bucket: 'kun-galgame-patch',
      Key: Date.now().toString(),
      Body: buffer
    })
  )

  return NextResponse.json('success', { status: 200 })
}
