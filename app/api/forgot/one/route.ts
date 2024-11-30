import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { stepOneSchema } from '~/validations/forgot'
import { prisma } from '~/prisma/index'
import { sendVerificationCodeEmail } from '~/app/api/utils/sendVerificationCodeEmail'

export const stepOne = async (
  input: z.infer<typeof stepOneSchema>,
  headers: Headers
) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.name }, { name: input.name }]
    }
  })
  if (!user) {
    return '用户未找到'
  }

  const result = await sendVerificationCodeEmail(headers, user.email, 'forgot')
  if (result) {
    return result
  }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, stepOneSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await stepOne(input, req.headers)
  if (typeof response === 'string') {
    return NextResponse.json(input)
  }

  return NextResponse.json({})
}
