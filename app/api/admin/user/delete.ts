import { z } from 'zod'
import { prisma } from '~/prisma/index'

const userIdSchema = z.object({
  uid: z.coerce.number({ message: '用户 ID 必须为数字' }).min(1).max(9999999)
})

export const deleteUser = async (input: z.infer<typeof userIdSchema>) => {
  const user = await prisma.user.findUnique({
    where: {
      id: input.uid
    }
  })
  if (!user) {
    return '未找到用户'
  }

  await prisma.user.delete({
    where: { id: input.uid }
  })
  return {}
}
