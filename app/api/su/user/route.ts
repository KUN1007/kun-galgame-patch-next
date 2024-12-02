import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'
import { adminUpdateUserSchema } from '~/validations/admin'

export const updateUser = async (
  input: z.infer<typeof adminUpdateUserSchema>,
  currentUserUid: number
) => {
  const { uid, dailyImageCount, ...rest } = input

  if (rest.role >= 3) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserUid }
    })
    if (!user) {
      return '用户未找到'
    }
    if (user.role < 4) {
      return '设置用户为管理员仅限超级管理员可用'
    }
  }

  await prisma.user.update({
    where: { id: uid },
    data: {
      daily_image_count: dailyImageCount,
      ...rest
    }
  })

  return {}
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, adminUpdateUserSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await updateUser(input, payload.uid)
  return NextResponse.json(response)
}
