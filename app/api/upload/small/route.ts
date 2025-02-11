import { NextRequest, NextResponse } from 'next/server'
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { prisma } from '~/prisma'
import { z } from 'zod'
import {
  CHUNK_SIZE,
  MIN_FILE_SIZE,
  MAX_SMALL_FILE_SIZE,
  USER_DAILY_UPLOAD_LIMIT,
  CREATOR_DAILY_UPLOAD_LIMIT
} from '~/config/upload'
import { resourceUploadSchema } from '~/validations/resource'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { sanitizeFileName } from '~/utils/sanitizeFileName'
import { s3 } from '~/lib/s3'

const uploadRequestSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  contentType: z.string()
})

const uploadSmallResource = async (
  fileSize: number,
  fileName: string,
  uid: number
) => {
  if (fileSize > MAX_SMALL_FILE_SIZE) {
    return '文件大小超过 100MB, 请使用大文件上传'
  }

  // Generate presigned POST URL for direct upload
  const presignedPost = await createPresignedPost(s3, {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Conditions: [['content-length-range', MIN_FILE_SIZE, fileSize]],
    Expires: 3600
  })

  return NextResponse.json({
    uploadId: upload.id,
    ...presignedPost
  })
}

const checkRequestValid = async (fileSize: number, uid: number) => {
  const user = await prisma.user.findUnique({ where: { id: uid } })
  if (!user) {
    return '用户未找到'
  }
  const newTotal = user.daily_upload_size + fileSize
  if (user.role === 1 && newTotal >= USER_DAILY_UPLOAD_LIMIT) {
    return '您今日的上传大小已达到 100MB 限额'
  }
  if (user.role === 2 && newTotal >= CREATOR_DAILY_UPLOAD_LIMIT) {
    return '您今日的上传大小已达到 5GB 限额'
  }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, resourceUploadSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  const validRes = checkRequestValid(payload.uid)
  if (typeof validRes === 'string') {
    return NextResponse.json(validRes)
  }

  const fileName = sanitizeFileName(input.fileName)

  const res = await processResourceChunk(fileName, chunk, metadata, uid)
  if (typeof res === 'string') {
    return NextResponse.json(res)
  }

  return NextResponse.json(res)
}
