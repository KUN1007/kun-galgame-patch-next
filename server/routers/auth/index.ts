import { cookies } from 'next/headers'
import { router, publicProcedure, privateProcedure } from '~/lib/trpc'
import { verify, hash } from '@node-rs/argon2'
import { generateKunToken, deleteKunToken } from '~/server/utils/jwt'
import {
  loginSchema,
  registerSchema,
  sendRegisterEmailVerificationCodeSchema
} from '~/validations/auth'
import { prisma } from '~/prisma/index'
import { sendVerificationCodeEmail } from '~/server/utils/sendVerificationCodeEmail'
import { verifyVerificationCode } from '~/server/utils/verifyVerificationCode'
import { getRemoteIp } from '~/server/utils/getRemoteIp'
import type { UserStore } from '~/store/userStore'

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const { name, password } = input

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: name }, { name }]
      }
    })
    if (!user) {
      return '用户未找到'
    }

    const isPasswordValid = await verify(user.password, password)
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

    const responseData: UserStore = {
      uid: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      moemoepoint: user.moemoepoint
    }
    return responseData
  }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email, code, password } = input

      if (!ctx.headers || !ctx.headers['x-forwarded-for']) {
        return '读取请求头失败'
      }

      const isCodeValid = await verifyVerificationCode(email, code)
      if (!isCodeValid) {
        return '您的验证码无效, 请重新输入'
      }

      const sameUsernameUser = await prisma.user.findUnique({ where: { name } })
      if (sameUsernameUser) {
        return '您的用户名已经有人注册了, 请修改'
      }

      const sameEmailUser = await prisma.user.findUnique({ where: { email } })
      if (sameEmailUser) {
        return '您的邮箱已经有人注册了, 请修改'
      }

      const hashedPassword = await hash(password)
      const ip = getRemoteIp(ctx.headers)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          ip
        }
      })

      const token = await generateKunToken(user.id, name, '30d')
      const cookie = await cookies()
      cookie.set('kun-galgame-patch-moe-token', token, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      })

      const responseData: UserStore = {
        uid: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        moemoepoint: user.moemoepoint
      }
      return responseData
    }),

  sendRegisterCode: publicProcedure
    .input(sendRegisterEmailVerificationCodeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.headers || !ctx.headers['x-forwarded-for']) {
        return '读取请求头失败'
      }

      const sameUsernameUser = await prisma.user.findUnique({
        where: { name: input.name }
      })
      if (sameUsernameUser) {
        return '您的用户名已经有人注册了, 请修改'
      }

      const sameEmailUser = await prisma.user.findUnique({
        where: { email: input.email }
      })
      if (sameEmailUser) {
        return '您的邮箱已经有人注册了, 请修改'
      }

      const result = await sendVerificationCodeEmail(
        ctx.headers,
        input.email,
        'register'
      )
      if (result) {
        return result
      }
    }),

  logout: privateProcedure.mutation(async ({ ctx }) => {
    const cookie = await cookies()
    cookie.delete('kun-galgame-patch-moe-token')
    await deleteKunToken(ctx.uid)
    return true
  })
})
