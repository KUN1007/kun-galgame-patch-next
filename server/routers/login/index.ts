import { router, publicProcedure } from '~/lib/trpc'
import { z } from 'zod'
import { hash, verify } from '@node-rs/argon2'
import prisma from '~/prisma/index'
import jwt from 'jsonwebtoken'

export const loginRouter = router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(17),
        email: z.string().email(),
        password: z.string().min(6).max(107)
      })
    )
    .mutation(async ({ input }) => {
      const { name, email, password } = input
      const hashedPassword = await hash(password)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      })

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '30d'
      })

      return { token }
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const { email, password } = input

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        throw new Error('Invalid credentials')
      }

      const isPasswordValid = await verify(password, user.password)
      if (!isPasswordValid) {
        throw new Error('Invalid credentials')
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '1d'
      })

      return { token }
    })
})
