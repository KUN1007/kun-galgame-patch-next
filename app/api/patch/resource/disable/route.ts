import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

const resourceIdSchema = z.object({
  resourceId: z.coerce
    .number({ message: '资源 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export const toggleResourceDisable = async (
  input: z.infer<typeof resourceIdSchema>,
  uid: number,
  role: number
) => {
  const { resourceId } = input

  const resource = await prisma.patch_resource.findUnique({
    where: { id: resourceId }
  })
  if (!resource) {
    return '未找到资源'
  }
  if (resource.user_id !== uid && role < 3) {
    return '您没有权限禁止资源下载'
  }

  await prisma.patch_resource.update({
    where: { id: input.resourceId },
    data: { status: resource.status ? 0 : 1 }
  })

  return {}
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, resourceIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await toggleResourceDisable(input, payload.uid, payload.role)
  return NextResponse.json(response)
}
