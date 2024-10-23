import { cookies } from 'next/headers'
import { router, publicProcedure } from '~/lib/trpc'
import { z } from 'zod'
import { verify, hash } from '@node-rs/argon2'
import { generateToken } from '~/server/utils/jwt'
import { TRPCError } from '@trpc/server'
import { loginSchema } from '~/validations/login'

export const loginRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const { name, password } = input

    const user = await ctx.prisma.user.findFirst({
      where: {
        OR: [{ email: name }, { name }]
      }
    })
    if (!user) {
      throw new TRPCError({
        code: 'FORBIDDEN'
      })
    }

    const isPasswordValid = await verify(user.password, password)
    if (!isPasswordValid) {
      return '用户密码错误'
    }

    const token = generateToken(user.id, user.name, '30d')
    const cookie = await cookies()
    cookie.set('kun-galgame-patch-moe-token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    return token
  }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(17),
        email: z.string().email(),
        password: z.string().min(6).max(107)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input
      const hashedPassword = await hash(password)

      const user = await ctx.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      })

      const token = generateToken(user.id, name, '30d')
      const cookie = await cookies()
      cookie.set('kun-galgame-patch-moe-token', token, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      })

      return token
    })
})
