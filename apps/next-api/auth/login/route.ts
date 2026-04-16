import { z } from 'zod'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyPassword } from '~/app/api/utils/algorithm'
import { generateKunToken } from '~/app/api/utils/jwt'
import { loginSchema } from '~/validations/auth'
import { prisma } from '~/prisma/index'
import { checkKunCaptchaExist } from '~/app/api/utils/verifyKunCaptcha'
import type { UserState } from '~/store/userStore'

export const login = async (input: z.infer<typeof loginSchema>) => {
  const { name, password, captcha } = input
  const res = await checkKunCaptchaExist(captcha)
  if (!res) {
    return '人机验证无效, 请完成人机验证'
  }

  const normalizedName = name.toLowerCase()
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: normalizedName, mode: 'insensitive' } },
        { name: { equals: normalizedName, mode: 'insensitive' } }
      ]
    }
  })
  if (!user) {
    return '用户未找到'
  }
  if (user.status === 2) {
    return '该用户已被封禁, 如果您觉得有任何问题, 请联系我们'
  }

  const isPasswordValid = await verifyPassword(password, user.password)
  if (!isPasswordValid) {
    return '用户密码错误'
  }

  const token = await generateKunToken(user.id, user.name, user.role, '30d')
  const cookie = await cookies()
  cookie.set('kun-galgame-patch-moe-token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  })

  const responseData: UserState = {
    uid: user.id,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    moemoepoint: user.moemoepoint,
    role: user.role,
    dailyCheckIn: user.daily_check_in,
    dailyImageLimit: user.daily_image_count,
    dailyUploadLimit: user.daily_upload_size,
    mutedMessageTypes: []
  }

  return responseData
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, loginSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await login(input)
  return NextResponse.json(response)
}
