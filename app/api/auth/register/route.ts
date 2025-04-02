import { z } from 'zod'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { hashPassword } from '~/app/api/utils/algorithm'
import { verifyVerificationCode } from '~/app/api/utils/verifyVerificationCode'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'
import { generateKunToken } from '~/app/api/utils/jwt'
import { registerSchema } from '~/validations/auth'
import { prisma } from '~/prisma/index'
import type { UserState } from '~/store/userStore'

export const register = async (
  input: z.infer<typeof registerSchema>,
  ip: string
) => {
  const { name, email, code, password } = input

  const isCodeValid = await verifyVerificationCode(email, code)
  if (!isCodeValid) {
    return '您的验证码无效, 请重新输入'
  }

  const normalizedName = name.toLowerCase()
  const sameUsernameUser = await prisma.user.findFirst({
    where: { name: { equals: normalizedName, mode: 'insensitive' } }
  })
  if (sameUsernameUser) {
    return '您的用户名已经有人注册了, 请修改'
  }

  const sameEmailUser = await prisma.user.findUnique({ where: { email } })
  if (sameEmailUser) {
    return '您的邮箱已经有人注册了, 请修改'
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      ip
    }
  })

  const token = await generateKunToken(user.id, name, user.role, '30d')
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
  const input = await kunParsePostBody(req, registerSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  if (
    !req.headers ||
    (!req.headers.get('x-forwarded-for') &&
      !req.headers.get('x-real-ip') &&
      !req.headers.get('CF-Connecting-IP'))
  ) {
    return NextResponse.json('读取请求头失败')
  }

  const ip = getRemoteIp(req.headers)

  const response = await register(input, ip)
  return NextResponse.json(response)
}
