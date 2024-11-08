import { router, publicProcedure } from '~/lib/trpc'
import { stepOneSchema, stepTwoSchema } from '~/validations/forgot'
import { prisma } from '~/prisma/index'
import { sendVerificationCodeEmail } from '~/server/utils/sendVerificationCodeEmail'
import { verify, hash } from '@node-rs/argon2'
import { verifyVerificationCode } from '~/server/utils/verifyVerificationCode'

export const forgotRouter = router({
  stepOne: publicProcedure
    .input(stepOneSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.headers || !ctx.headers['x-forwarded-for']) {
        return '读取请求头失败'
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.name }, { name: input.name }]
        }
      })
      if (!user) {
        return '用户未找到'
      }

      const result = await sendVerificationCodeEmail(
        ctx.headers,
        user.email,
        'forgot'
      )
      if (result) {
        return result
      }
    }),

  stepTwo: publicProcedure
    .input(stepTwoSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.headers || !ctx.headers['x-forwarded-for']) {
        return '读取请求头失败'
      }

      if (input.newPassword !== input.confirmPassword) {
        return '两次密码输入不一致'
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.name }, { name: input.name }]
        }
      })
      if (!user) {
        return '用户未找到'
      }

      const isCodeValid = await verifyVerificationCode(
        user.email,
        input.verificationCode
      )
      if (!isCodeValid) {
        return '您的邮箱验证码无效'
      }

      const hashedPassword = await hash(input.newPassword)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
    })
})
