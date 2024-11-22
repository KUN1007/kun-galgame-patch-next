import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { deleteKunToken } from '~/server/utils/jwt'
import { cookies } from 'next/headers'
import { randomNum } from '~/utils/random'
import type { UserState } from '~/store/userStore'
import type { UserInfo } from '~/types/api/user'

export const getProfile = publicProcedure
  .input(
    z.object({
      id: z.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {
    const data = await prisma.user.findUnique({
      where: { id: input.id },
      include: {
        _count: {
          select: {
            patch_resource: true,
            patch: true,
            patch_comment: true,
            patch_favorite: true
          }
        },
        follower: true,
        following: true
      }
    })
    if (!data) {
      return '未找到用户'
    }

    const followerUserUid = data.following.map((f) => f.follower_id)

    const user: UserInfo = {
      id: data.id,
      requestUserUid: ctx.uid ?? 0,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      bio: data.bio,
      role: data.role,
      status: data.status,
      registerTime: String(data.register_time),
      moemoepoint: data.moemoepoint,
      follower: data.following.length,
      following: data.follower.length,
      isFollow: followerUserUid.includes(ctx.uid ?? 0),
      _count: data._count
    }

    return user
  })

export const logout = privateProcedure.mutation(async ({ ctx, input }) => {
  await deleteKunToken(ctx.uid)
  const cookie = await cookies()
  cookie.delete('kun-galgame-patch-moe-token')
})

export const checkIn = privateProcedure.mutation(async ({ ctx, input }) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.uid }
  })
  if (!user) {
    return '用户未找到'
  }
  if (user.daily_check_in) {
    return '您今天已经签到过了'
  }

  const randomMoemoepoints = randomNum(0, 7)

  await prisma.user.update({
    where: { id: ctx.uid },
    data: {
      moemoepoint: { increment: randomMoemoepoints },
      daily_check_in: { set: 1 }
    }
  })

  return randomMoemoepoints
})

export const status = privateProcedure.query(async ({ ctx, input }) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.uid }
  })
  if (!user) {
    return '用户未找到'
  }

  const responseData: UserState = {
    uid: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    moemoepoint: user.moemoepoint,
    checkIn: user.daily_check_in
  }

  return responseData
})
