import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminUpdateUserSchema } from '~/validations/admin'
import { deleteKunToken } from '~/app/api/utils/jwt'

export const updateUser = async (
  input: z.infer<typeof adminUpdateUserSchema>,
  adminUid: number
) => {
  const { uid, dailyImageCount, ...rest } = input

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      daily_image_count: true,
      name: true,
      bio: true,
      role: true,
      status: true
    }
  })
  if (!user) {
    return '未找到该用户'
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminUid }
  })
  if (!admin) {
    return '未找到该管理员'
  }
  if (rest.role >= 3 && admin.role < 4) {
    return '设置用户为管理员仅限超级管理员可用'
  }

  await deleteKunToken(uid)

  return prisma.$transaction(async (prisma) => {
    await prisma.user.update({
      where: { id: uid },
      data: {
        daily_image_count: dailyImageCount,
        ...rest
      }
    })

    await prisma.admin_log.create({
      data: {
        type: 'update',
        user_id: adminUid,
        content: `管理员 ${admin.name} 更改了一个用户的信息\n\n更改内容:\n${JSON.stringify(input)}\n\n原用户信息:\n${JSON.stringify(user)}}`
      }
    })

    return {}
  })
}
