import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { sendVerificationCodeEmail } from '~/app/api/utils/sendVerificationCodeEmail'
import { sendResetEmailVerificationCodeSchema } from '~/validations/user'
import { checkKunCaptchaExist } from '~/app/api/utils/verifyKunCaptcha'
import { getEnableOnlyCreatorCreateStatus } from '~/app/api/admin/setting/creator/getEnableOnlyCreatorCreateStatus'

const sendCode = async (req: NextRequest) => {
  const input = await kunParsePostBody(
    req,
    sendResetEmailVerificationCodeSchema
  )
  if (typeof input === 'string') {
    return input
  }
  if (!req.headers || !req.headers.get('x-forwarded-for')) {
    return '读取请求头失败'
  }

  const res = await checkKunCaptchaExist(input.captcha)
  if (!res) {
    return '人机验证无效, 请完成人机验证'
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
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return '用户未登录'
  }
  const { enableOnlyCreatorCreate } = await getEnableOnlyCreatorCreateStatus()
  if (enableOnlyCreatorCreate) {
    return NextResponse.json('网站正在遭受攻击, 暂时不允许更改邮箱')
  }

  const res = await sendCode(req)
  if (typeof res === 'string') {
    return NextResponse.json(res)
  }
  return NextResponse.json({})
}
