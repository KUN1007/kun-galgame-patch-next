import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { adminEnableOnlyCreatorSchema } from '~/validations/admin'
import { setKv, delKv } from '~/lib/redis'
import { KUN_PATCH_ENABLE_ONLY_CREATOR_CREATE_KEY } from '~/config/redis'
import { getEnableOnlyCreatorCreateStatus } from './getEnableOnlyCreatorCreateStatus'

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  const res = await getEnableOnlyCreatorCreateStatus()
  return NextResponse.json(res)
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, adminEnableOnlyCreatorSchema)
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

  if (input.enableOnlyCreatorCreate) {
    await setKv(KUN_PATCH_ENABLE_ONLY_CREATOR_CREATE_KEY, 'true')
  } else {
    await delKv(KUN_PATCH_ENABLE_ONLY_CREATOR_CREATE_KEY)
  }

  return NextResponse.json({})
}
