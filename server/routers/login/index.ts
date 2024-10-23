import { createTRPCRouter, publicProcedure } from '~/server/routers/trpc'
import { z } from 'zod'
import { verify, hash } from '@node-rs/argon2'
import { generateToken } from '~/server/utils/jwt'

export const loginRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        name: z.string().email().or(z.string().min(1).max(17)),
        password: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, password } = input

      const user = await ctx.prisma.user.findFirst({
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

      const token = generateToken(user.id, user.name, '30d')

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

      return token
    })
})
