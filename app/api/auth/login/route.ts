import { z } from 'zod'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyPassword } from '~/app/api/utils/algorithm'
import { generateKunToken } from '~/app/api/utils/jwt'
import { loginSchema } from '~/validations/auth'
import { prisma } from '~/prisma/index'
import type { UserState } from '~/store/userStore'

export const login = async (input: z.infer<typeof loginSchema>) => {
  const { name, password } = input

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: name }, { name }]
    }
  })
  if (!user) {
    return '用户未找到'
  }

  const isPasswordValid = await verifyPassword(password, user.password)
  if (!isPasswordValid) {
    return '用户密码错误'
  }

  const token = await generateKunToken(user.id, user.name, '30d')
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
    dailyUploadLimit: user.daily_upload_size
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
