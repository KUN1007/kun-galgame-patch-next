import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { sendVerificationCodeEmail } from '~/app/api/utils/sendVerificationCodeEmail'
import { sendResetEmailVerificationCodeSchema } from '~/validations/user'

const sendCode = async (req: NextRequest) => {
  const input = await kunParsePostBody(
    req,
    sendResetEmailVerificationCodeSchema
  )
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return '用户未登录'
  }
  if (!req.headers || !req.headers.get('x-forwarded-for')) {
    return '读取请求头失败'
  }

  const result = await sendVerificationCodeEmail(
    req.headers,
    input.email,
    'reset'
  )
  if (result) {
    return result
  }
}

export const POST = async (req: NextRequest) => {
  const res = await sendCode(req)
  if (typeof res === 'string') {
    return NextResponse.json(res)
  }
  return NextResponse.json({})
}
