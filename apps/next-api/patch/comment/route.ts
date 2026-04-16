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
  patchCommentCreateSchema,
  patchCommentUpdateSchema
} from '~/validations/patch'
import { getPatchComment } from './get'
import { createPatchComment } from './create'
import { updateComment } from './update'
import { deleteComment } from './delete'
import { checkKunCaptchaExist } from '~/app/api/utils/verifyKunCaptcha'
import { getCommentVerifyStatus } from '~/app/api/admin/setting/comment/getCommentVerifyStatus'
import { getPatchCommentSchema } from '~/validations/patch'

const commentIdSchema = z.object({
  commentId: z.coerce
    .number({ message: '评论 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getPatchCommentSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)

  const response = await getPatchComment(input, payload?.uid ?? 0)
  return NextResponse.json(response)
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, patchCommentCreateSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const { enableCommentVerify } = await getCommentVerifyStatus()
  if (enableCommentVerify) {
    const res = await checkKunCaptchaExist(input.captcha)
    if (!res) {
      return NextResponse.json(
        '人机验证无效, 请刷新页面在发送评论时完成人机验证'
      )
    }
  }

  const response = await createPatchComment(input, payload.uid)
  return NextResponse.json(response)
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, patchCommentUpdateSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await updateComment(input, payload.uid)
  return NextResponse.json(response)
}

export const DELETE = async (req: NextRequest) => {
  const input = kunParseDeleteQuery(req, commentIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await deleteComment(input, payload.uid)
  return NextResponse.json(response)
}
