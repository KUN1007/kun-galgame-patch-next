import { z } from 'zod'
import { router, privateProcedure } from '~/lib/trpc'
import { hash } from '@node-rs/argon2'

export const updateUserSchema = z.object({
  name: z.string().min(1).max(17).optional(),
  email: z.string().email().max(1007).optional(),
  password: z.string().min(6).max(1007).optional(),
  avatar: z.string().max(233).optional(),
  bio: z.string().max(107).optional()
})

export const userRouter = router({
  update: privateProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { password, ...rest } = input
      const updateData: any = { ...rest }

      if (password) {
        updateData.password = await hash(password)
      }

      const user = await ctx.prisma.user.update({
        where: { id: ctx.uid },
        data: updateData
      })

      return {
        uid: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        moemoepoint: user.moemoepoint
      }
    }),

  getProfile: privateProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          moemoepoint: true,
          like: true,
          role: true,
          register_time: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user
    })
})
