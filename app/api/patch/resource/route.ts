import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import {
  kunParseGetQuery,
  kunParsePostBody,
  kunParsePutBody,
  kunParseDeleteQuery
} from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import {
  patchResourceCreateSchema,
  patchResourceUpdateSchema
} from '~/validations/patch'
import { getPatchResource } from './get'
import { createPatchResource } from './create'
import { updatePatchResource } from './update'
import { deleteResource } from './delete'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

const resourceIdSchema = z.object({
  resourceId: z.coerce
    .number({ message: '资源 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchResource(input)
  return NextResponse.json(response)
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, patchResourceCreateSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await createPatchResource(input, payload.uid)
  return NextResponse.json(response)
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

  const response = await deleteResource(input, payload.uid)
  return NextResponse.json(response)
}
