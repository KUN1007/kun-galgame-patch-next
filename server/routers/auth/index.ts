import { z } from 'zod'
import { cookies } from 'next/headers'
import { router, publicProcedure, privateProcedure } from '~/lib/trpc'
import { verify, hash } from '@node-rs/argon2'
import { generateKunToken, deleteKunToken } from '~/server/utils/jwt'
import { loginSchema, registerSchema } from '~/validations/auth'
import { prisma } from '~/prisma/index'
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
      const { name, email, password } = input
      const hashedPassword = await hash(password)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
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
    .input(
      z.object({
        email: z.string().email({ message: '请输入合法的邮箱格式' })
      })
    )
    .mutation(async (a) => {
      console.log(a)
    }),

  logout: privateProcedure.mutation(async ({ ctx }) => {
    const cookie = await cookies()
    cookie.delete('kun-galgame-patch-moe-token')
    await deleteKunToken(ctx.uid)
    return true
  })
})
