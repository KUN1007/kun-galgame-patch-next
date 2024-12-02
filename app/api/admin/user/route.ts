import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery, kunParsePutBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'
import {
  adminPaginationSchema,
  adminUpdateUserSchema
} from '~/validations/admin'
import { deleteKunToken } from '~/app/api/utils/jwt'
import type { AdminUser } from '~/types/api/admin'

export const getUserInfo = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    await prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        _count: {
          select: {
            patch_resource: true,
            patch: true
          }
        }
      }
    }),
    await prisma.user.count()
  ])

  const users: AdminUser[] = data.map((user) => ({
    id: user.id,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    role: user.role,
    created: user.created,
    status: user.status,
    dailyImageCount: user.daily_image_count,
    _count: user._count
  }))

  return { users, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, adminPaginationSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getUserInfo(input)
  return NextResponse.json(response)
}

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

  await deleteKunToken(uid)

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
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  const response = await updateUser(input, payload.uid)
  return NextResponse.json(response)
}
