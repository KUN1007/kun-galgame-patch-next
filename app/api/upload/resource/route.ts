import { NextRequest, NextResponse } from 'next/server'
import { setKv } from '~/lib/redis'
import { generateFileHash } from '../calculateFileStreamHash'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { ALLOWED_EXTENSIONS } from '~/constants/resource'
import { sanitizeFileName } from '~/utils/sanitizeFileName'
import { prisma } from '~/prisma'
import {
  ensureUploadDir,
  writeChunk,
  mergeChunks,
  cleanupChunks
} from '../utils'
import {
  CHUNK_SIZE,
  MAX_LARGE_FILE_SIZE,
  USER_DAILY_UPLOAD_LIMIT,
  CREATOR_DAILY_UPLOAD_LIMIT
} from '~/config/upload'
import { getEnableOnlyCreatorCreateStatus } from '~/app/api/admin/setting/creator/getEnableOnlyCreatorCreateStatus'
import type { KunChunkMetadata } from '~/types/api/upload'

const getFileExtension = (filename: string) => {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase()
}

const processResourceChunk = async (
  fileName: string,
  chunk: Blob,
  metadata: KunChunkMetadata,
  uid: number
) => {
  await ensureUploadDir()
  const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
  await writeChunk(metadata.fileId, chunkBuffer, metadata.chunkIndex)

  if (metadata.chunkIndex === metadata.totalChunks - 1) {
    try {
      // IMPORTANT, ensure the filename is valid
      metadata.fileName = fileName

      const mergedFilePath = await mergeChunks(
        metadata.fileId,
        metadata.totalChunks,
        metadata.fileName
      )
      metadata.filepath = mergedFilePath

      const hash = await generateFileHash(mergedFilePath)
      const totalChunkSize =
        CHUNK_SIZE * (metadata.totalChunks - 1) + chunkBuffer.length
      metadata.fileHash = hash
      metadata.fileSize = totalChunkSize

      await setKv(hash, JSON.stringify(metadata), 24 * 60 * 60)
      await prisma.user.update({
        where: { id: uid },
        data: { daily_upload_size: { increment: totalChunkSize } }
      })

      return metadata
    } catch (error) {
      await cleanupChunks(metadata.fileId, metadata.totalChunks)
      return '合并上传资源分片错误'
    }
  }

  return metadata
}

const checkRequestValid = async (req: NextRequest) => {
  const formData = await req.formData()
  const chunk = formData.get('chunk') as Blob
  const metadata = JSON.parse(
    formData.get('metadata') as string
  ) as KunChunkMetadata
  if (metadata.fileSize > MAX_LARGE_FILE_SIZE) {
    return '补丁资源大小超过最大大小 1GB'
  }
  if (!chunk) {
    return '错误的资源分片'
  }

  const fileExtension = getFileExtension(metadata.fileName)
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return `不支持的文件类型: ${fileExtension}`
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return '用户未认证'
  }
  const user = await prisma.user.findUnique({ where: { id: payload.uid } })
  if (!user) {
    return '用户未找到'
  }
  if (user.role === 1 && user.daily_upload_size >= USER_DAILY_UPLOAD_LIMIT) {
    return '您今日的上传大小已达到 100MB 限额'
  }
  if (user.role === 2 && user.daily_upload_size >= CREATOR_DAILY_UPLOAD_LIMIT) {
    return '您今日的上传大小已达到 5GB 限额'
  }
  const { enableOnlyCreatorCreate } = await getEnableOnlyCreatorCreateStatus()
  if (enableOnlyCreatorCreate && payload.role < 2) {
    return '网站正在遭受攻击, 目前仅允许创作者创建和更改项目'
  }

  return { chunk, metadata, uid: payload.uid }
}

export const POST = async (req: NextRequest) => {
  const input = await checkRequestValid(req)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const { chunk, metadata, uid } = input
  const fileName = sanitizeFileName(metadata.fileName)

  const res = await processResourceChunk(fileName, chunk, metadata, uid)
  if (typeof res === 'string') {
    return NextResponse.json(res)
  }

  return NextResponse.json(res)
}
