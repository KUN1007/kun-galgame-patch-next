import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { adminEnableCommentVerifySchema } from '~/validations/admin'
import { getKv, setKv, delKv } from '~/lib/redis'
import { KUN_PATCH_ENABLE_COMMENT_VERIFY_KEY } from '~/config/redis'

export const getCommentVerifyStatus = async () => {
  const isEnableCommentVerify = await getKv(KUN_PATCH_ENABLE_COMMENT_VERIFY_KEY)
  return {
    enableCommentVerify: !!isEnableCommentVerify
  }
}

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  const res = await getCommentVerifyStatus()
  return NextResponse.json(res)
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, adminEnableCommentVerifySchema)
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

  if (input.enableCommentVerify) {
    await setKv(KUN_PATCH_ENABLE_COMMENT_VERIFY_KEY, 'true')
  } else {
    await delKv(KUN_PATCH_ENABLE_COMMENT_VERIFY_KEY)
  }

  return NextResponse.json({})
}
