import { NextResponse } from 'next/server'
import { setKv } from '~/lib/redis'
import { calculateFileStreamHash } from '../fs'
import { verifyHeaderCookie } from '../auth'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file')

  const payload = await verifyHeaderCookie(req)

  if (!payload) {
    return NextResponse.json({ status: 233, statusText: '用户未认证' })
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ status: 500, statusText: '错误的文件输入' })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileSizeInMB = buffer.length / (1024 * 1024)

  if (fileSizeInMB > 100) {
    return NextResponse.json({
      status: 400,
      statusText: '文件大小超过限制',
      fileSize: `${fileSizeInMB.toFixed(3)} MB`
    })
  }

  const res = await calculateFileStreamHash(buffer, 'uploads', file.name)

  await setKv(res.fileHash, res.finalFilePath, 24 * 60 * 60)

  return NextResponse.json({
    filetype: 's3',
    fileHash: res.fileHash,
    fileSize: `${fileSizeInMB.toFixed(3)} MB`
  })
}

export async function DELETE(req: Request) {}
