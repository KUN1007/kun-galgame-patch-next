import { z } from 'zod'
import { prisma } from '~/prisma/index'

const walkthroughIdSchema = z.object({
  walkthroughId: z.coerce.number().min(1).max(9999999)
})

export const deleteWalkthrough = async (
  input: z.infer<typeof walkthroughIdSchema>,
  uid: number
) => {
  const patchWalkthrough = await prisma.patch_walkthrough.findUnique({
    where: {
      id: input.walkthroughId,
      user_id: uid
    }
  })
  if (!patchWalkthrough) {
    return '未找到对应的攻略'
  }
  if (patchWalkthrough.user_id !== uid) {
    return '您没有权限删除该攻略'
  }

  await prisma.patch_walkthrough.delete({
    where: { id: input.walkthroughId }
  })
  return {}
}
