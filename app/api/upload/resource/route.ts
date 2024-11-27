import { NextResponse } from 'next/server'
import { setKv } from '~/lib/redis'
import { calculateFileStreamHash } from '../fs'
import { verifyHeaderCookie } from '../auth'
import { ALLOWED_EXTENSIONS } from '~/constants/resource'
import { prisma } from '~/prisma'

const getFileExtension = (filename: string) => {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase()
}

const checkRequestValid = async (req: Request) => {
  const formData = await req.formData()
  const file = formData.get('file')

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return '用户未认证'
  }

  if (!file || !(file instanceof File)) {
    return '错误的文件输入'
  }

  const fileExtension = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return `不支持的文件类型: ${fileExtension}`
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileSizeInMB = buffer.length / (1024 * 1024)

  if (fileSizeInMB > 100) {
    return '文件大小超过限制, 最大为 100 MB'
  }

  const user = await prisma.user.findUnique({ where: { id: payload.uid } })
  if (!user) {
    return '用户未找到'
  }
  if (user.role < 2) {
    return '您的权限不足, 创作者或者管理员才可以上传文件到对象存储'
  }

  return { buffer, file, fileSizeInMB }
}

export async function POST(req: Request) {
  const validData = await checkRequestValid(req)
  if (typeof validData === 'string') {
    return NextResponse.json(validData)
  }

  const { buffer, file, fileSizeInMB } = validData

  const res = await calculateFileStreamHash(buffer, 'uploads', file.name)

  await setKv(res.fileHash, res.finalFilePath, 24 * 60 * 60)

  return NextResponse.json({
    filetype: 's3',
    fileHash: res.fileHash,
    fileSize: `${fileSizeInMB.toFixed(3)} MB`
  })
}
