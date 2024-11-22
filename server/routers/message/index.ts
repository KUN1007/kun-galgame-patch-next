import { router, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { createMessageSchema, getMessageSchema } from '~/validations/message'
import { createMessage } from '~/server/utils/message'

export const messageRouter = router({
  getUnread: privateProcedure.query(async ({ ctx, input }) => {
    const unread = await prisma.user_message.findFirst({
      where: { recipient_id: ctx.uid, status: 0 }
    })
    return unread
  }),

  readMessage: privateProcedure.mutation(async ({ ctx, input }) => {
    await prisma.user_message.updateMany({
      where: { recipient_id: ctx.uid },
      data: { status: { set: 1 } }
    })
  }),

  createMessage: privateProcedure
    .input(createMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, content, recipientId, patchId, resourceId, commentId } =
        input

      const message = await createMessage({
        type,
        content,
        sender_id: ctx.uid,
        recipient_id: recipientId,
        patch_id: patchId,
        patch_resource_id: resourceId,
        comment_id: commentId
      })

      return message
    }),

  getMessage: privateProcedure
    .input(getMessageSchema)
    .query(async ({ ctx, input }) => {
      const { type, page, limit } = input
      const offset = (page - 1) * limit

      const where = type
        ? {
            recipient_id: ctx.uid,
            type
          }
        : {
            recipient_id: ctx.uid
            // type: { in: ['like', 'favorite', 'comment', 'pr'] }
          }

      const [messages, total] = await Promise.all([
        prisma.user_message.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { created: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.user_message.count({ where })
      ])

      return { messages, total }
    })
})
