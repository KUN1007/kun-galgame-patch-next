import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import {
  kunParseDeleteQuery,
  kunParseGetQuery,
  kunParsePostBody,
  kunParsePutBody
} from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import {
  createWalkthroughSchema,
  updateWalkthroughSchema
} from '~/validations/walkthrough'
import { getWalkthrough } from './get'
import { createWalkthrough } from './create'
import { updateWalkthrough } from './update'
import { deleteWalkthrough } from './delete'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

const walkthroughIdSchema = z.object({
  walkthroughId: z.coerce.number().min(1).max(9999999)
})

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getWalkthrough(input)
  return NextResponse.json(response)
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createWalkthroughSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await createWalkthrough(input, payload.uid)
  return NextResponse.json(response)
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, updateWalkthroughSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await updateWalkthrough(input, payload.uid)
  return NextResponse.json(response)
}

export const DELETE = async (req: NextRequest) => {
  const input = kunParseDeleteQuery(req, walkthroughIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await deleteWalkthrough(input, payload.uid)
  return NextResponse.json(response)
}
