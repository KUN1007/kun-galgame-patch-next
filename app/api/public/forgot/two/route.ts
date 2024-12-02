import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { stepTwoSchema } from '~/validations/forgot'
import { prisma } from '~/prisma/index'
import { hashPassword } from '~/app/api/utils/algorithm'
import { verifyVerificationCode } from '~/app/api/utils/verifyVerificationCode'

export const stepTwo = async (input: z.infer<typeof stepTwoSchema>) => {
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

  const hashedPassword = await hashPassword(input.newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, stepTwoSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await stepTwo(input)
  if (typeof response === 'string') {
    return NextResponse.json(input)
  }

  return NextResponse.json({})
}
