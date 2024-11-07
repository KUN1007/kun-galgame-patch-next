import { z } from 'zod'
import { router, publicProcedure, privateProcedure } from '~/lib/trpc'
import { verify } from '@node-rs/argon2'
import { prisma } from '~/prisma/index'
import { avatarSchema, bioSchema, usernameSchema } from '~/validations/user'
import { parseAvatarImageMiddleware } from './_middleware'
import { uploadUserAvatar } from './_upload'
import type { UserInfo } from '~/types/api/user'

export const updateUserSchema = z.object({
  name: z.string().min(1).max(17).optional(),
  email: z.string().email().max(1007).optional(),
  password: z.string().min(6).max(1007).optional(),
  avatar: z.string().max(233).optional(),
  bio: z.string().max(107).optional()
})

export const userRouter = router({
  updateUserAvatar: privateProcedure
    .use(parseAvatarImageMiddleware)
    .input(avatarSchema)
    .mutation(async ({ ctx, input }) => {
      const avatarArrayBuffer = input.avatar as ArrayBuffer
      const res = await uploadUserAvatar(avatarArrayBuffer, ctx.uid)
      if (!res) {
        return '上传图片错误, 未知错误'
      }
      if (typeof res === 'string') {
        return res
      }

      const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/user/avatar/user_${ctx.uid}/avatar-mini.avif`

      await prisma.user.update({
        where: { id: ctx.uid },
        data: { avatar: imageLink }
      })

      return { avatar: imageLink }
    }),

  updateUsername: privateProcedure
    .input(usernameSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({ where: { id: ctx.uid } })
      if (!user) {
        return '用户未找到'
      }
      if (user.moemoepoint < 30) {
        return '更改用户名最少需要 30 萌萌点, 您的萌萌点不足'
      }

      await prisma.user.update({
        where: { id: ctx.uid },
        data: { name: input, moemoepoint: { increment: -30 } }
      })
    }),

  updateBio: privateProcedure
    .input(bioSchema)
    .mutation(async ({ ctx, input }) => {
      await prisma.user.update({
        where: { id: ctx.uid },
        data: { bio: input }
      })
    }),

  getProfile: publicProcedure
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
              patch: true,
              patch_comment: true,
              patch_favorite: true,
              patch_pull_request: true
            }
          }
        }
      })
      if (!data) {
        return '未找到用户'
      }

      const user: UserInfo = {
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        bio: data.bio,
        role: data.role,
        status: data.status,
        registerTime: String(data.register_time),
        moemoepoint: data.moemoepoint,
        _count: data._count
      }

      return user
    })
})
