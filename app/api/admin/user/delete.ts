import { z } from 'zod'
import { setKv } from '~/lib/redis'
import { prisma } from '~/prisma/index'
import {
  ADMIN_DELETE_EMAIL_CACHE_KEY,
  ADMIN_DELETE_IP_CACHE_KEY
} from '~/config/redis'

const userIdSchema = z.object({
  uid: z.coerce.number({ message: '用户 ID 必须为数字' }).min(1).max(9999999)
})

export const deleteUser = async (
  input: z.infer<typeof userIdSchema>,
  uid: number
) => {
  const user = await prisma.user.findUnique({
    where: { id: input.uid }
  })
  if (!user) {
    return '未找到用户'
  }

  const admin = await prisma.user.findUnique({
    where: { id: uid }
  })
  if (!admin) {
    return '未找到管理员'
  }

  await setKv(
    `${ADMIN_DELETE_EMAIL_CACHE_KEY}:${user.email}`,
    user.email,
    10 * 365 * 24 * 60 * 60
  )
  await setKv(
    `${ADMIN_DELETE_IP_CACHE_KEY}:${user.ip}`,
    user.ip,
    10 * 365 * 24 * 60 * 60
  )

  return prisma.$transaction(async (prisma) => {
    await prisma.user.delete({
      where: { id: input.uid }
    })

    await prisma.admin_log.create({
      data: {
        type: 'delete',
        user_id: uid,
        content: `管理员 ${admin.name} 删除了一个用户\n\n${JSON.stringify(user)}`
      }
    })

    return {}
  })
}
