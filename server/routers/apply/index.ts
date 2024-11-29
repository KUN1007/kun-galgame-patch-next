import { router, privateProcedure, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { createMessage } from '~/server/utils/message'

export const applyRouter = router({
  getApplyStatus: publicProcedure.query(async ({ ctx, input }) => {
    const count = await prisma.patch_resource.count({
      where: { user_id: ctx.uid ?? 0 }
    })
    const user = await prisma.user.findUnique({
      where: { id: ctx.uid ?? 0 }
    })
    const role = user?.role ?? 0

    return { count, role }
  }),

  applyForCreator: privateProcedure.mutation(async ({ ctx, input }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.uid },
      include: {
        _count: {
          select: {
            patch_resource: true
          }
        }
      }
    })
    if (!user) {
      return '未找到该用户'
    }

    if (user._count.patch_resource < 3) {
      return '您暂时不可以申请成为创作者, 您可以继续发布补丁'
    }

    const message = await prisma.user_message.findFirst({
      where: { type: 'apply', sender_id: ctx.uid, status: 0 }
    })
    if (message) {
      return '您有一条正在进行中的申请, 请等待该申请的完成'
    }

    await createMessage({
      type: 'apply',
      content: '申请成为创作者',
      sender_id: ctx.uid
    })
  })
})
