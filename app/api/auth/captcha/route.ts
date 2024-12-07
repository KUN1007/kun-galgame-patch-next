import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { generateCaptcha } from './generate'
import { verifyCaptcha } from './verify'
import { captchaSchema } from '~/validations/auth'

export const GET = async () => {
  const captcha = await generateCaptcha()
  return NextResponse.json(captcha)
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, captchaSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const captcha = await verifyCaptcha(input.sessionId, input.selectedIds)
  return NextResponse.json(captcha)
}
