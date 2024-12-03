import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import {
  kunParseGetQuery,
  kunParsePutBody,
  kunParseDeleteQuery
} from '~/app/api/utils/parseQuery'
import { adminPaginationSchema } from '~/validations/admin'
import { getPatchResource } from './get'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { patchResourceUpdateSchema } from '~/validations/patch'
import { updatePatchResource } from './update'
import { deleteResource } from './delete'

const resourceIdSchema = z.object({
  resourceId: z.coerce
    .number({ message: '资源 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export async function GET(req: NextRequest) {
  const input = kunParseGetQuery(req, adminPaginationSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const res = await getPatchResource(input)
  return NextResponse.json(res)
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, patchResourceUpdateSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  const response = await updatePatchResource(input, payload.uid)
  return NextResponse.json(response)
}

export const DELETE = async (req: NextRequest) => {
  const input = kunParseDeleteQuery(req, resourceIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  const response = await deleteResource(input, payload.uid)
  return NextResponse.json(response)
}
