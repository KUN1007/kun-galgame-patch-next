import { privateProcedure } from '~/lib/trpc'
import { hash, verify } from '@node-rs/argon2'
import { prisma } from '~/prisma/index'
import {
  avatarSchema,
  bioSchema,
  usernameSchema,
  sendResetEmailVerificationCodeSchema,
  resetEmailSchema,
  passwordSchema
} from '~/validations/user'
import { parseAvatarImageMiddleware } from './_middleware'
import { uploadUserAvatar } from './_upload'
import { sendVerificationCodeEmail } from '~/server/utils/sendVerificationCodeEmail'
import { verifyVerificationCode } from '~/server/utils/verifyVerificationCode'

export const updateUserAvatar = privateProcedure
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
  })

export const updateUsername = privateProcedure
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
  })

export const updateBio = privateProcedure
  .input(bioSchema)
  .mutation(async ({ ctx, input }) => {
    await prisma.user.update({
      where: { id: ctx.uid },
      data: { bio: input }
    })
  })

export const sendResetEmailVerificationCode = privateProcedure
  .input(sendResetEmailVerificationCodeSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.headers || !ctx.headers['x-forwarded-for']) {
      return '读取请求头失败'
    }

    const result = await sendVerificationCodeEmail(
      ctx.headers,
      input.email,
      'reset'
    )
    if (result) {
      return result
    }
  })

export const updateEmail = privateProcedure
  .input(resetEmailSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.headers || !ctx.headers['x-forwarded-for']) {
      return '读取请求头失败'
    }

    const isCodeValid = await verifyVerificationCode(input.email, input.code)
    if (!isCodeValid) {
      return '您的验证码无效, 请重新输入'
    }

    await prisma.user.update({
      where: { id: ctx.uid },
      data: { email: input.email }
    })
  })

export const updatePassword = privateProcedure
  .input(passwordSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.headers || !ctx.headers['x-forwarded-for']) {
      return '读取请求头失败'
    }

    const user = await prisma.user.findUnique({ where: { id: ctx.uid } })
    const res = await verify(user ? user.password : '', input.oldPassword)
    if (!res) {
      return '旧密码输入错误'
    }

    const hashedPassword = await hash(input.newPassword)

    await prisma.user.update({
      where: { id: ctx.uid },
      data: { password: hashedPassword }
    })
  })
