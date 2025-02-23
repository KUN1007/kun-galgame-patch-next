import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { updateWalkthroughSchema } from '~/validations/walkthrough'

export const updateWalkthrough = async (
  input: z.infer<typeof updateWalkthroughSchema>,
  uid: number
) => {
  const { walkthroughId, name, content } = input
  const walkthrough = await prisma.patch_walkthrough.findUnique({
    where: { id: walkthroughId }
  })
  if (!walkthrough) {
    return '未找到该攻略'
  }
  if (walkthrough.user_id !== uid) {
    return '您没有权限更改该攻略'
  }

  await prisma.patch_walkthrough.update({
    where: { id: walkthroughId, user_id: uid },
    data: { name, content }
  })

  return {}
}
