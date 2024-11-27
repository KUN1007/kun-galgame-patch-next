import { router, privateProcedure, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'

export const applyRouter = router({
  getUserResourceCount: publicProcedure.query(async ({ ctx, input }) => {
    const count = await prisma.patch_resource.count({
      where: { user_id: ctx.uid ?? 0 }
    })

    return count
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

    // await prisma.user.update({
    //   where: { id: ctx.uid },
    //   data: { role: { set: 2 } }
    // })
  })
})
