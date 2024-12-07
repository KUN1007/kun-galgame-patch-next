import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'
import { sendVerificationCodeEmail } from '~/app/api/utils/sendVerificationCodeEmail'
import { sendRegisterEmailVerificationCodeSchema } from '~/validations/auth'
import { prisma } from '~/prisma/index'
import { checkCaptchaExist } from '../captcha/verify'

export const sendRegisterCode = async (
  input: z.infer<typeof sendRegisterEmailVerificationCodeSchema>,
  headers: Headers
) => {
  const res = await checkCaptchaExist(input.captcha)
  if (!res) {
    return '人机验证无效, 请完成人机验证'
  }

  const sameUsernameUser = await prisma.user.findUnique({
    where: { name: input.name }
  })
  if (sameUsernameUser) {
    return '您的用户名已经有人注册了, 请修改'
  }

  const sameEmailUser = await prisma.user.findUnique({
    where: { email: input.email }
  })
  if (sameEmailUser) {
    return '您的邮箱已经有人注册了, 请修改'
  }

  const result = await sendVerificationCodeEmail(
    headers,
    input.email,
    'register'
  )
  if (result) {
    return result
  }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(
    req,
    sendRegisterEmailVerificationCodeSchema
  )
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  if (!req.headers || !req.headers.get('x-forwarded-for')) {
    return NextResponse.json('读取请求头失败')
  }

  const ip = getRemoteIp(req.headers)

  const response = await sendRegisterCode(input, req.headers)
  return NextResponse.json(response)
}
