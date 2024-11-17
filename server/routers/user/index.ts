import { z } from 'zod'
import { router, publicProcedure, privateProcedure } from '~/lib/trpc'
import { hash, verify } from '@node-rs/argon2'
import { prisma } from '~/prisma/index'
import {
  avatarSchema,
  bioSchema,
  usernameSchema,
  sendResetEmailVerificationCodeSchema,
  resetEmailSchema,
  passwordSchema,
  updateUserSchema
} from '~/validations/user'
import { parseAvatarImageMiddleware } from './_middleware'
import { uploadUserAvatar } from './_upload'
import { sendVerificationCodeEmail } from '~/server/utils/sendVerificationCodeEmail'
import { verifyVerificationCode } from '~/server/utils/verifyVerificationCode'
import { deleteKunToken } from '~/server/utils/jwt'
import { cookies } from 'next/headers'
import {
  updateUserAvatar,
  updateUsername,
  updateBio,
  sendResetEmailVerificationCode,
  updateEmail,
  updatePassword
} from './settings'
import type { UserInfo } from '~/types/api/user'

export const userRouter = router({
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
              patch_resource: true,
              patch: true,
              patch_comment: true,
              patch_favorite: true
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
    }),

  logout: privateProcedure.mutation(async ({ ctx, input }) => {
    await deleteKunToken(ctx.uid)
    const cookie = await cookies()
    cookie.delete('kun-galgame-patch-moe-token')
  }),

  updateUserAvatar,
  updateUsername,
  updateBio,
  sendResetEmailVerificationCode,
  updateEmail,
  updatePassword
})
