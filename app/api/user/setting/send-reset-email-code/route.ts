import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { sendVerificationCodeEmail } from '~/app/api/utils/sendVerificationCodeEmail'
import { bioSchema } from '~/validations/user'

const sendCode = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, bioSchema)
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
    input.bio,
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
}
