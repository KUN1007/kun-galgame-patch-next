import { publicProcedure } from '~/lib/trpc'
import { hash, verify } from '@node-rs/argon2'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import { parseAvatarImageMiddleware } from './_middleware'
import { uploadUserAvatar } from './_upload'
import { sendVerificationCodeEmail } from '~/server/utils/sendVerificationCodeEmail'
import { verifyVerificationCode } from '~/server/utils/verifyVerificationCode'

export const updateUserAvatar = publicProcedure
  .input(getUserInfoSchema)
  .mutation(async ({ ctx, input }) => {
    const { page, limit } = input
  })
